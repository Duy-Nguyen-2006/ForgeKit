#!/usr/bin/env node
'use strict';

/**
 * route-status.cjs — Diagnostic CLI for ForgeKit routing system
 *
 * Phase 5.6: Shows routing health, recent decisions, and coverage stats.
 *
 * Usage:
 *   node scripts/route-status.cjs               # overview
 *   node scripts/route-status.cjs --recent 10   # last 10 routing decisions
 *   node scripts/route-status.cjs --coverage    # skill coverage analysis
 *   node scripts/route-status.cjs --check "Fix bug"  # test a single intent
 */

const fs = require('fs');
const path = require('path');
const { route, ROUTING_TABLE } = require('./route-intent.cjs');

const LOG_DIR = path.resolve(process.env.FORGEKIT_LOG_DIR || '.forgekit');
const LOG_FILE = path.join(LOG_DIR, 'route-log.jsonl');

const args = process.argv.slice(2);

// ─── Commands ─────────────────────────────────────────────────────

if (args.includes('--check')) {
  const idx = args.indexOf('--check');
  const intent = args.slice(idx + 1).join(' ');
  if (!intent) {
    console.error('Usage: --check "<intent string>"');
    process.exit(1);
  }
  checkIntent(intent);
} else if (args.includes('--recent')) {
  const idx = args.indexOf('--recent');
  const count = parseInt(args[idx + 1] || '5', 10);
  showRecent(count);
} else if (args.includes('--coverage')) {
  showCoverage();
} else {
  showOverview();
}

// ─── Overview ─────────────────────────────────────────────────────

function showOverview() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  ForgeKit Routing Status Dashboard v5.6  ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Routing table stats
  const categories = {};
  for (const entry of ROUTING_TABLE) {
    categories[entry.category] = (categories[entry.category] || 0) + 1;
  }

  console.log('Routing Table:');
  console.log(`  Total skills: ${ROUTING_TABLE.length}`);
  for (const [cat, count] of Object.entries(categories).sort()) {
    console.log(`  ${cat.padEnd(15)} ${count} skill(s)`);
  }

  // Log stats
  if (fs.existsSync(LOG_FILE)) {
    const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
    const entries = lines.filter(Boolean).map(l => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);

    console.log(`\nRoute Log:`);
    console.log(`  Total decisions logged: ${entries.length}`);

    if (entries.length > 0) {
      // Skill distribution
      const skillDist = {};
      for (const e of entries) {
        skillDist[e.primary] = (skillDist[e.primary] || 0) + 1;
      }
      console.log(`  Skill distribution:`);
      for (const [skill, count] of Object.entries(skillDist).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${skill.padEnd(25)} ${count}`);
      }

      // Action distribution
      const actionDist = {};
      for (const e of entries) {
        actionDist[e.action] = (actionDist[e.action] || 0) + 1;
      }
      console.log(`  Action distribution:`);
      for (const [action, count] of Object.entries(actionDist).sort((a, b) => b[1] - a[1])) {
        console.log(`    ${action.padEnd(25)} ${count}`);
      }

      // Average confidence
      const avgConf = entries.reduce((sum, e) => sum + (e.confidence || 0), 0) / entries.length;
      console.log(`  Avg confidence: ${(avgConf * 100).toFixed(1)}%`);

      // Low confidence count
      const lowConf = entries.filter(e => (e.confidence || 0) < 0.60).length;
      console.log(`  Low confidence (<60%): ${lowConf} (${((lowConf / entries.length) * 100).toFixed(1)}%)`);
    }
  } else {
    console.log(`\nRoute Log: No decisions logged yet.`);
    console.log(`  (Log file: ${LOG_FILE})`);
  }

  console.log('');
}

// ─── Recent ───────────────────────────────────────────────────────

function showRecent(count) {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No route log found.');
    return;
  }

  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
  const entries = lines.filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);

  const recent = entries.slice(-count);

  console.log(`\nLast ${recent.length} routing decisions:\n`);
  for (const e of recent) {
    const ts = e.ts ? new Date(e.ts).toLocaleString() : 'unknown';
    console.log(`[${ts}] ${e.primary} (${(e.confidence * 100).toFixed(0)}%) action=${e.action} gap=${e.gap} verb=${e.verb || '-'} hash=${e.intentHash}`);
    if (e.secondary && e.secondary.length > 0) {
      console.log(`  secondary: ${e.secondary.join(', ')}`);
    }
  }
  console.log('');
}

// ─── Coverage ─────────────────────────────────────────────────────

function showCoverage() {
  console.log('\nSkill Coverage Analysis:\n');

  // Check which skills have routing entries
  const skillsWithRouting = new Set(ROUTING_TABLE.map(e => e.skill));

  // Check which skills exist on disk
  const skillsDir = path.join(__dirname, '..', 'skills');
  const skillsOnDisk = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  // Skills with routing but no SKILL.md
  const routingOnly = [...skillsWithRouting].filter(s => !skillsOnDisk.includes(s));
  // Skills with SKILL.md but no routing
  const diskOnly = skillsOnDisk.filter(s => !skillsWithRouting.has(s));
  // Skills with both
  const covered = [...skillsWithRouting].filter(s => skillsOnDisk.includes(s));

  console.log(`  Covered (routing + SKILL.md): ${covered.length}`);
  for (const s of covered) {
    const entry = ROUTING_TABLE.find(e => e.skill === s);
    console.log(`    ✓ ${s} (${entry.verbs.length} verbs, ${entry.nouns.length} nouns)`);
  }

  if (routingOnly.length > 0) {
    console.log(`\n  ⚠ Routing exists but no SKILL.md: ${routingOnly.length}`);
    for (const s of routingOnly) {
      console.log(`    ⚠ ${s}`);
    }
  }

  if (diskOnly.length > 0) {
    console.log(`\n  ⚠ SKILL.md exists but no routing: ${diskOnly.length}`);
    for (const s of diskOnly) {
      console.log(`    ⚠ ${s}`);
    }
  }

  console.log('');
}

// ─── Check ────────────────────────────────────────────────────────

function checkIntent(intent) {
  const result = route(intent);
  console.log('\nRouting Check Result:\n');
  console.log(JSON.stringify(result, null, 2));
  console.log('');
}
