#!/usr/bin/env node
'use strict';

/**
 * route-log.cjs — Post-tool routing observability hook for ForgeKit
 *
 * Phase 5.5: Logs routing decisions to a local JSONL file for
 * debugging and continuous improvement of the routing system.
 *
 * When the orchestrator routes to a skill, this hook captures:
 * - The routing decision (primary skill, secondary, confidence)
 * - The user intent
 * - Timestamp and session info
 * - Hash of the intent (for privacy)
 *
 * Log file: .forgekit/route-log.jsonl (one JSON object per line)
 *
 * Usage (via stdin pipe):
 *   echo '{"intent":"Fix bug","primary":"fix","secondary":[],"confidence":0.95}' \
 *     | node hooks/post-tool/route-log.cjs
 *
 * The hook is passive — it never blocks or modifies the routing decision.
 * Exit 0 always (fail-open).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOG_DIR = path.resolve(process.env.FORGEKIT_LOG_DIR || '.forgekit');
const LOG_FILE = path.join(LOG_DIR, 'route-log.jsonl');
const MAX_LOG_SIZE = parseInt(process.env.FORGEKIT_ROUTE_LOG_MAX_SIZE || '5242880', 10); // 5MB default

// ─── Crash Guard ──────────────────────────────────────────────────
process.stdin.setEncoding('utf8');
let input = '';

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    run();
  } catch {
    // Fail-open: never block routing
  }
  process.exit(0);
});

// ─── Hash & Redact ────────────────────────────────────────────────

function hashRedact(text) {
  // SHA-256 hash of the intent for privacy-preserving logging
  return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
}

// ─── Rotate Log if Too Large ──────────────────────────────────────

function rotateLogIfNeeded() {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const stats = fs.statSync(LOG_FILE);
    if (stats.size >= MAX_LOG_SIZE) {
      const backupFile = LOG_FILE.replace('.jsonl', `.backup.${Date.now()}.jsonl`);
      fs.renameSync(LOG_FILE, backupFile);
    }
  } catch {
    // Ignore rotation errors
  }
}

// ─── Main ─────────────────────────────────────────────────────────

function run() {
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    return; // Not valid JSON, skip silently
  }

  // Required fields
  const intent = data.intent || data.input || data.text || '';
  if (!intent) return;

  const primary = data.primary || data.skill || '';
  const secondary = data.secondary || [];
  const confidence = data.confidence || 0;
  const action = data.action || 'unknown';

  // Build log entry
  const entry = {
    ts: new Date().toISOString(),
    intentHash: hashRedact(intent),
    intentLength: intent.length,
    primary,
    secondary,
    confidence,
    action,
    gap: data.gap || 0,
    verb: data.verb || null,
    sessionId: data.sessionId || process.env.FORGEKIT_SESSION_ID || null,
  };

  // Ensure log directory exists
  if (!fs.existsSync(LOG_DIR)) {
    try {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    } catch {
      return; // Can't create log dir, skip
    }
  }

  // Rotate if needed
  rotateLogIfNeeded();

  // Append entry
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
  } catch {
    // Can't write log, skip silently
  }
}
