#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const SOURCE_SKILL = path.join(PROJECT_ROOT, 'claude', 'skills', 'auto', 'SKILL.md');
const SOURCE_WORKFLOW = path.join(PROJECT_ROOT, 'claude', 'skills', 'auto', 'references', 'auto-workflow.md');
const GENERATOR = path.join(PROJECT_ROOT, 'scripts', 'generate-forgecode.py');
const NATIVE_COMMAND = path.join(PROJECT_ROOT, '.forge', 'commands', 'ck:auto.md');
const NATIVE_AGENTS = path.join(PROJECT_ROOT, '.forge', 'AGENTS.md');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(text, expected, message) {
  if (!text.includes(expected)) {
    throw new Error(`${message}\nExpected to find: ${expected}`);
  }
}

function assertNotContains(text, unexpected, message) {
  if (text.includes(unexpected)) {
    throw new Error(`${message}\nUnexpected text: ${unexpected}`);
  }
}

function assertOrder(text, before, after, message) {
  const beforeIndex = text.indexOf(before);
  const afterIndex = text.indexOf(after);
  if (beforeIndex === -1 || afterIndex === -1 || beforeIndex >= afterIndex) {
    throw new Error(`${message}\nExpected order: ${before} before ${after}`);
  }
}

const sourceSkill = readUtf8(SOURCE_SKILL);
const sourceWorkflow = readUtf8(SOURCE_WORKFLOW);
const generator = readUtf8(GENERATOR);
const nativeCommand = readUtf8(NATIVE_COMMAND);
const nativeAgents = readUtf8(NATIVE_AGENTS);

console.log('\n=== ck:auto contract tests ===\n');

test('approval gate forbids implementation before approval', () => {
  for (const text of [sourceSkill, nativeCommand]) {
    assertContains(text, 'Do not edit files', 'Contract should forbid file edits before approval');
    assertContains(text, 'Do not run implementation commands', 'Contract should forbid implementation commands before approval');
    assertOrder(text, 'Do not edit files', 'After approval', 'Pre-approval guard should appear before post-approval execution');
  }
});

test('spec golden format includes non-technical safety sections', () => {
  const requiredSections = [
    'Mục tiêu',
    'Kết quả mong muốn',
    'Giả định an toàn',
    'Phạm vi sẽ làm',
    'Ngoài phạm vi',
    'Cách kiểm tra',
    'Tiêu chí hoàn thành',
    'Cần bạn xác nhận',
  ];
  for (const section of requiredSections) {
    assertContains(sourceSkill, section, `Source skill should include Spec section ${section}`);
    assertContains(nativeCommand, section, `Native command should include Spec section ${section}`);
  }
});

test('approval state transitions directly to autonomous execution', () => {
  for (const text of [sourceSkill, nativeCommand, sourceWorkflow]) {
    assertContains(text, 'After approval', 'Contract should define post-approval state');
    assertContains(text, 'do not ask', 'Contract should avoid repeated approval/questions');
    assertContains(text, 'Final report', 'Contract should finish with final report');
  }
  assertContains(sourceWorkflow, 'Only the Spec needs user approval', 'Workflow should document single approval gate');
});

test('specialist routing is explicit but honest about sub-agents', () => {
  for (const text of [sourceSkill, nativeCommand, nativeAgents]) {
    assertContains(text, 'planner/researcher', 'Contract should mention planning/research routing');
    assertContains(text, 'debugger', 'Contract should mention debugger routing');
    assertContains(text, 'tester', 'Contract should mention tester routing');
    assertContains(text, 'code-reviewer', 'Contract should mention review routing');
    assertContains(text, 'Do not claim sub-agents were launched', 'Contract should prohibit fake sub-agent claims');
  }
});

test('verification contract prevents fake success', () => {
  for (const text of [sourceSkill, nativeCommand, nativeAgents]) {
    assertContains(text, 'Never report success without', 'Contract should forbid unverified success');
    assertContains(text, 'strongest available', 'Contract should require strongest available verification');
  }
  assertContains(sourceSkill, 'Do not fake test results', 'Source skill should explicitly prohibit fake test results');
});

test('generator emits the hardened native contract', () => {
  assertContains(generator, '## Non-Negotiable Contract', 'Generator should emit non-negotiable contract');
  assertContains(generator, 'Intent Normalization and Spec Gate', 'Generator should emit intent normalization phase');
  assertContains(generator, 'Route work to the right capability', 'Generator should emit specialist routing');
  assertContains(generator, 'Do not claim that sub-agents were used', 'Generator should emit honest sub-agent rule');
});

test('ForgeCode native docs do not advertise slash command as native', () => {
  assertContains(nativeCommand, ':ck:auto', 'Native command context should be ck:auto command content');
  assertNotContains(nativeCommand, 'Use `/ck:auto`', 'Native command should not advertise slash command usage');
});

console.log(`\nPassed: ${passed}`);
if (failed > 0) {
  console.log(`Failed: ${failed}`);
  process.exit(1);
}
