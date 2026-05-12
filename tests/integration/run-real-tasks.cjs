#!/usr/bin/env node
const { route } = require('../../scripts/route-intent.cjs');
const fs = require('fs');

const cases = JSON.parse(fs.readFileSync('./real-world-tasks.json', 'utf8'));
let pass = 0;
const results = [];

for (const c of cases) {
  const r = route(c.task);
  const ok = r.primary === c.expected;
  if (ok) pass++;
  results.push({ repo: c.repo, task: c.task, expected: c.expected, got: r.primary, secondary: r.secondary, confidence: r.confidence, action: r.action, ok });
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${status} [${c.repo}]`);
  console.log(`  task: ${c.task}`);
  console.log(`  expected=${c.expected}  got=${r.primary} (conf=${r.confidence}, action=${r.action})`);
  if (!ok) {
    console.log(`  top3:`, JSON.stringify(r.topCandidates));
  }
}
console.log(`\n${pass}/${cases.length} passed (${(pass/cases.length*100).toFixed(1)}%)`);
fs.writeFileSync('./real-world-tasks-results.json', JSON.stringify(results, null, 2));
