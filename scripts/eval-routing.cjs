#!/usr/bin/env node
'use strict';

/**
 * eval-routing.cjs — Eval harness for ForgeKit routing
 *
 * Phase 5.3: Runs routing fixtures through route-intent.cjs
 * and reports pass/fail statistics.
 *
 * Usage:
 *   node scripts/eval-routing.cjs
 *   node scripts/eval-routing.cjs --verbose
 *   node scripts/eval-routing.cjs --fix id=5        # show details for fixture #5
 *   node scripts/eval-routing.cjs --lang vi          # only Vietnamese fixtures
 *   node scripts/eval-routing.cjs --category quality  # only quality category
 *
 * Exit codes:
 *   0 — all tests passed
 *   1 — some tests failed
 */

const fs = require('fs');
const path = require('path');
const { route } = require('./route-intent.cjs');

const FIXTURES_PATH = path.join(__dirname, '..', 'tests', 'routing-fixtures.json');

// ─── Load Fixtures ────────────────────────────────────────────────

if (!fs.existsSync(FIXTURES_PATH)) {
  console.error(`Fixtures not found: ${FIXTURES_PATH}`);
  process.exit(1);
}

const fixturesData = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf8'));
let fixtures = fixturesData.fixtures;

// ─── CLI Filters ──────────────────────────────────────────────────

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const fixIdx = args.indexOf('--fix');
const fixId = fixIdx !== -1 ? parseInt(args[fixIdx + 1]?.replace('id=', ''), 10) : null;
const langIdx = args.indexOf('--lang');
const langFilter = langIdx !== -1 ? args[langIdx + 1] : null;

if (langFilter) {
  fixtures = fixtures.filter(f => f.language === langFilter);
}

if (fixId !== null) {
  fixtures = fixtures.filter(f => f.id === fixId);
}

// ─── Evaluation ───────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;
const failures = [];

console.log(`\n╔══════════════════════════════════════╗`);
console.log(`║  ForgeKit Routing Eval Harness v5.3  ║`);
console.log(`╚══════════════════════════════════════╝\n`);
console.log(`Fixtures: ${fixtures.length}`);
console.log(`${'─'.repeat(50)}\n`);

for (const fixture of fixtures) {
  const result = route(fixture.intent);

  const primaryMatch = result.primary === fixture.expectedPrimary;
  const confidenceOk = result.confidence >= fixture.expectedMinConfidence;
  const secondaryOk = !fixture.expectedSecondary || fixture.expectedSecondary.length === 0 ||
    fixture.expectedSecondary.some(s => result.secondary.includes(s));

  const allOk = primaryMatch && confidenceOk;

  if (allOk) {
    passed++;
    if (verbose) {
      console.log(`✓ #${fixture.id}: "${fixture.intent}" → ${result.primary} (${result.confidence})`);
    }
  } else {
    failed++;
    const reasons = [];
    if (!primaryMatch) reasons.push(`primary: got ${result.primary}, expected ${fixture.expectedPrimary}`);
    if (!confidenceOk) reasons.push(`confidence: ${result.confidence} < ${fixture.expectedMinConfidence}`);

    failures.push({
      id: fixture.id,
      intent: fixture.intent,
      expected: fixture.expectedPrimary,
      got: result.primary,
      confidence: result.confidence,
      minConfidence: fixture.expectedMinConfidence,
      reasons,
    });

    console.log(`✗ #${fixture.id}: "${fixture.intent}"`);
    for (const r of reasons) {
      console.log(`    ${r}`);
    }
    if (verbose) {
      console.log(`    Full result: ${JSON.stringify(result, null, 2).split('\n').join('\n    ')}`);
    }
  }
}

// ─── Summary ──────────────────────────────────────────────────────

const total = passed + failed;
const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed}/${total} passed (${passRate}%)`);
if (failed > 0) {
  console.log(`Failed: ${failed}`);
}
console.log(`\nConfidence Distribution:`);

// Confidence buckets
const buckets = { '0.90+': 0, '0.75-0.89': 0, '0.60-0.74': 0, '0.30-0.59': 0, '<0.30': 0 };
for (const fixture of fixtures) {
  const result = route(fixture.intent);
  if (result.confidence >= 0.90) buckets['0.90+']++;
  else if (result.confidence >= 0.75) buckets['0.75-0.89']++;
  else if (result.confidence >= 0.60) buckets['0.60-0.74']++;
  else if (result.confidence >= 0.30) buckets['0.30-0.59']++;
  else buckets['<0.30']++;
}

for (const [range, count] of Object.entries(buckets)) {
  const bar = '█'.repeat(Math.min(count, 40));
  console.log(`  ${range.padEnd(10)} ${bar} ${count}`);
}

// Action distribution
const actions = {};
for (const fixture of fixtures) {
  const result = route(fixture.intent);
  actions[result.action] = (actions[result.action] || 0) + 1;
}
console.log(`\nAction Distribution:`);
for (const [action, count] of Object.entries(actions).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${action.padEnd(20)} ${count}`);
}

// Language breakdown
const viFixtures = fixtures.filter(f => f.language === 'vi');
const enFixtures = fixtures.filter(f => f.language === 'en');
let viPassed = 0, enPassed = 0;
for (const f of viFixtures) {
  const r = route(f.intent);
  if (r.primary === f.expectedPrimary && r.confidence >= f.expectedMinConfidence) viPassed++;
}
for (const f of enFixtures) {
  const r = route(f.intent);
  if (r.primary === f.expectedPrimary && r.confidence >= f.expectedMinConfidence) enPassed++;
}
console.log(`\nLanguage Breakdown:`);
if (viFixtures.length > 0) console.log(`  Vietnamese: ${viPassed}/${viFixtures.length} (${((viPassed/viFixtures.length)*100).toFixed(1)}%)`);
if (enFixtures.length > 0) console.log(`  English:    ${enPassed}/${enFixtures.length} (${((enPassed/enFixtures.length)*100).toFixed(1)}%)`);

if (failures.length > 0 && !verbose) {
  console.log(`\nRun with --verbose or --fix id=N for details.`);
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
