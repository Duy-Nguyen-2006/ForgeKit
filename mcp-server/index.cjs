#!/usr/bin/env node
'use strict';

/**
 * @forgekit/mcp-router — MCP Server for ForgeKit Runtime Routing
 *
 * Exposes route-intent.cjs logic as native MCP tools that ForgeCode
 * auto-discovers. This solves the critical issue where the LLM skips
 * the shell command instruction — MCP tools are first-class in ForgeCode
 * and appear in the tool list, making them impossible to miss.
 *
 * Tools exposed:
 *   1. route_intent  — Route user intent to skill(s), returns primary/secondary/confidence
 *   2. route_status  — Show routing health, recent decisions, coverage
 *   3. route_log     — Log a routing decision (for observability)
 *
 * Usage (by ForgeCode via .mcp.json):
 *   ForgeCode auto-starts this server and discovers tools
 *
 * Manual test:
 *   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node mcp-server/index.cjs
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// ─── Import routing logic ──────────────────────────────────────────
// We require the route-intent.cjs module directly for its routing logic
const ROUTING_MODULE_PATH = path.resolve(__dirname, '..', 'scripts', 'route-intent.cjs');
let routeModule;

try {
  routeModule = require(ROUTING_MODULE_PATH);
} catch (err) {
  console.error(`[forgekit-mcp] FATAL: Cannot load route-intent.cjs from ${ROUTING_MODULE_PATH}`);
  console.error(`[forgekit-mcp] Error: ${err.message}`);
  process.exit(1);
}

const { route, scoreIntent, ROUTING_TABLE } = routeModule;

// ─── Route Log Config ─────────────────────────────────────────────
const LOG_DIR = path.resolve(process.env.FORGEKIT_LOG_DIR || path.join(__dirname, '..', '.forgekit'));
const LOG_FILE = path.join(LOG_DIR, 'route-log.jsonl');
const MAX_LOG_SIZE = parseInt(process.env.FORGEKIT_ROUTE_LOG_MAX_SIZE || '5242880', 10);

// ─── Logging Helper ───────────────────────────────────────────────
function hashRedact(text) {
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

function rotateLogIfNeeded() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const stats = fs.statSync(LOG_FILE);
    if (stats.size >= MAX_LOG_SIZE) {
      const backupFile = LOG_FILE.replace('.jsonl', `.backup.${Date.now()}.jsonl`);
      fs.renameSync(LOG_FILE, backupFile);
    }
  } catch { /* ignore */ }
}

function appendRouteLog(entry) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    rotateLogIfNeeded();
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
    return true;
  } catch {
    return false;
  }
}

function readRecentLogs(count) {
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
    return lines.filter(Boolean).slice(-count).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Create MCP Server ────────────────────────────────────────────
const server = new McpServer({
  name: 'forgekit-router',
  version: '1.0.0',
  description: 'ForgeKit Runtime Router — deterministic intent-to-skill routing for ForgeCode',
});

// ─── Tool 1: route_intent ─────────────────────────────────────────
// This is the PRIMARY tool. When Forge sees a user request, it MUST
// call this tool first to determine which skill(s) to load.

server.tool(
  'route_intent',
  `MANDATORY FIRST ACTION: Route user intent to the correct ForgeKit skill. ` +
  `Call this BEFORE loading any skill. Returns primary skill, secondary skills, ` +
  `confidence score, and action (route/disambiguate/clarify/no-match). ` +
  `CRITICAL: Always call this tool first — do NOT skip or assume skill routing.`,
  {
    intent: z.string().describe('The exact user intent/request string to route. Use the full original user message.'),
  },
  async ({ intent }) => {
    try {
      const result = route(intent);

      // Auto-log the routing decision
      const logEntry = {
        ts: new Date().toISOString(),
        intentHash: hashRedact(intent),
        intentLength: intent.length,
        primary: result.primary,
        secondary: result.secondary,
        confidence: result.confidence,
        action: result.action,
        gap: result.gap,
        verb: result.verb,
        source: 'mcp-tool',
        sessionId: process.env.FORGEKIT_SESSION_ID || null,
      };
      appendRouteLog(logEntry);

      // Build human-readable response
      let response = `## Routing Result\n\n`;
      response += `- **Primary Skill**: \`${result.primary || 'none'}\`\n`;
      response += `- **Secondary Skills**: ${result.secondary.length > 0 ? result.secondary.map(s => `\`${s}\``).join(', ') : 'none'}\n`;
      response += `- **Confidence**: ${(result.confidence * 100).toFixed(0)}%\n`;
      response += `- **Gap**: ${result.gap}\n`;
      response += `- **Action**: \`${result.action}\`\n`;
      response += `- **Detected Verb**: ${result.verb || 'none'}\n`;

      if (result.action === 'route' || result.action === 'route-uncertain') {
        response += `\n✅ **Load ONLY the primary skill \`${result.primary}\`** (per maxPrimarySkillsInitial: 1).\n`;
        if (result.secondary.length > 0) {
          response += `📌 Secondary skills available if needed: ${result.secondary.map(s => `\`${s}\``).join(', ')} — load one at a time ONLY when the primary skill cannot complete the task.\n`;
        }
      }

      if (result.action === 'disambiguate' && result.disambiguate) {
        response += `\n⚠️ **Ambiguous intent**. ${result.disambiguate.question}\n`;
      }

      if (result.action === 'clarify') {
        response += `\n❓ **Intent unclear**. Ask the user for more details before proceeding.\n`;
      }

      if (result.action === 'no-match') {
        response += `\n❌ **No matching skill found**. Use the orchestrator prompt for manual routing.\n`;
      }

      response += `\n---\n*Routing decision logged to .forgekit/route-log.jsonl*`;

      return {
        content: [
          {
            type: 'text',
            text: response,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Routing error: ${err.message}\n\nFall back to orchestrator prompt for manual routing.`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ─── Tool 2: route_status ─────────────────────────────────────────
server.tool(
  'route_status',
  `Show ForgeKit routing system health: recent decisions, skill coverage, confidence stats.`,
  {
    mode: z.enum(['overview', 'recent', 'coverage']).default('overview').describe('What to show: overview (default), recent decisions, or skill coverage'),
    count: z.number().min(1).max(50).default(5).describe('Number of recent decisions to show (only for mode=recent)'),
  },
  async ({ mode, count }) => {
    try {
      if (mode === 'recent') {
        const logs = readRecentLogs(count);
        if (logs.length === 0) {
          return {
            content: [{ type: 'text', text: 'No routing decisions logged yet.' }],
          };
        }
        let text = `## Recent ${logs.length} Routing Decisions\n\n`;
        for (const e of logs) {
          const ts = e.ts ? new Date(e.ts).toLocaleString() : 'unknown';
          text += `- [${ts}] \`${e.primary}\` (${(e.confidence * 100).toFixed(0)}%) action=${e.action} gap=${e.gap}${e.source ? ` src=${e.source}` : ''}\n`;
        }
        return { content: [{ type: 'text', text }] };
      }

      if (mode === 'coverage') {
        const categories = {};
        for (const entry of ROUTING_TABLE) {
          categories[entry.category] = (categories[entry.category] || 0) + 1;
        }

        let text = `## Skill Coverage\n\n`;
        text += `Total routing entries: ${ROUTING_TABLE.length}\n\n`;
        for (const [cat, cnt] of Object.entries(categories).sort()) {
          text += `### ${cat} (${cnt} skills)\n`;
          for (const entry of ROUTING_TABLE.filter(e => e.category === cat)) {
            text += `- \`${entry.skill}\` — ${entry.verbs.length} verbs, ${entry.nouns.length} nouns\n`;
          }
          text += '\n';
        }

        // Check disk skills vs routing
        const skillsDir = path.join(__dirname, '..', 'skills');
        let diskOnly = [];
        try {
          const onDisk = fs.readdirSync(skillsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
          const routed = new Set(ROUTING_TABLE.map(e => e.skill));
          diskOnly = onDisk.filter(s => !routed.has(s) && s !== 'registry.md');
        } catch { /* ignore */ }

        if (diskOnly.length > 0) {
          text += `### ⚠ Skills without routing\n`;
          for (const s of diskOnly) {
            text += `- \`${s}\`\n`;
          }
        }

        return { content: [{ type: 'text', text }] };
      }

      // overview mode (default)
      const categories = {};
      for (const entry of ROUTING_TABLE) {
        categories[entry.category] = (categories[entry.category] || 0) + 1;
      }

      let text = `## ForgeKit Routing Status\n\n`;
      text += `**Routing Table**: ${ROUTING_TABLE.length} skills across ${Object.keys(categories).length} categories\n\n`;
      for (const [cat, cnt] of Object.entries(categories).sort()) {
        text += `- ${cat}: ${cnt} skill(s)\n`;
      }

      // Log stats
      if (fs.existsSync(LOG_FILE)) {
        const logs = readRecentLogs(1000);
        text += `\n**Route Log**: ${logs.length} decisions logged\n`;

        if (logs.length > 0) {
          const skillDist = {};
          for (const e of logs) {
            skillDist[e.primary] = (skillDist[e.primary] || 0) + 1;
          }
          text += `\nTop skills:\n`;
          for (const [skill, cnt] of Object.entries(skillDist).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
            text += `  - \`${skill}\`: ${cnt}\n`;
          }

          const avgConf = logs.reduce((sum, e) => sum + (e.confidence || 0), 0) / logs.length;
          text += `\nAvg confidence: ${(avgConf * 100).toFixed(1)}%\n`;

          const lowConf = logs.filter(e => (e.confidence || 0) < 0.60).length;
          text += `Low confidence (<60%): ${lowConf} (${((lowConf / logs.length) * 100).toFixed(1)}%)\n`;

          // MCP source stats
          const mcpSourced = logs.filter(e => e.source === 'mcp-tool').length;
          const shellSourced = logs.filter(e => !e.source || e.source !== 'mcp-tool').length;
          text += `\nRouting sources: MCP=${mcpSourced}, Shell=${shellSourced}\n`;
        }
      } else {
        text += `\n**Route Log**: No decisions logged yet.\n`;
      }

      return { content: [{ type: 'text', text }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Error getting route status: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ─── Tool 3: route_log ────────────────────────────────────────────
server.tool(
  'route_log',
  `Manually log a routing decision for observability. Called after route_intent or after manual routing.`,
  {
    intent: z.string().describe('The user intent that was routed'),
    primary: z.string().describe('The primary skill that was selected'),
    secondary: z.array(z.string()).default([]).describe('Secondary skills selected'),
    confidence: z.number().min(0).max(1).describe('Routing confidence score'),
    action: z.string().describe('Routing action taken (route/disambiguate/clarify/no-match)'),
    gap: z.number().default(0).describe('Gap between top two candidates'),
    verb: z.string().nullable().default(null).describe('Detected verb from intent'),
  },
  async ({ intent, primary, secondary, confidence, action, gap, verb }) => {
    const entry = {
      ts: new Date().toISOString(),
      intentHash: hashRedact(intent),
      intentLength: intent.length,
      primary,
      secondary,
      confidence,
      action,
      gap,
      verb,
      source: 'mcp-tool-manual',
      sessionId: process.env.FORGEKIT_SESSION_ID || null,
    };

    const success = appendRouteLog(entry);

    return {
      content: [
        {
          type: 'text',
          text: success
            ? `✅ Routing decision logged: \`${primary}\` (${(confidence * 100).toFixed(0)}%, action=${action})`
            : `⚠️ Failed to log routing decision (file write error)`,
        },
      ],
    };
  }
);

// ─── Start Server ─────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is running — communicates via stdin/stdout
  // Log to stderr so it doesn't interfere with MCP protocol
  process.stderr.write('[forgekit-mcp] Server started — 3 tools: route_intent, route_status, route_log\n');
}

main().catch((err) => {
  process.stderr.write(`[forgekit-mcp] Fatal: ${err.message}\n`);
  process.exit(1);
});
