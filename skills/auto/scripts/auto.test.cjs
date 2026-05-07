#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.resolve(__dirname, '../SKILL.md');
const REF_PATH = path.resolve(__dirname, '../references/auto-workflow.md');

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

function assertTrue(condition, message) {
  if (!condition) throw new Error(message);
}

function assertContains(text, expected, message) {
  if (!text.includes(expected)) {
    throw new Error(`${message}\nExpected to find: ${expected}`);
  }
}

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

const skill = readUtf8(SKILL_PATH);
const workflow = readUtf8(REF_PATH);

console.log('\n=== ck:auto skill tests ===\n');

test('skill file exists', () => {
  assertTrue(fs.existsSync(SKILL_PATH), 'SKILL.md should exist');
});

test('reference workflow file exists', () => {
  assertTrue(fs.existsSync(REF_PATH), 'auto-workflow.md should exist');
});

test('skill frontmatter exposes ck:auto name', () => {
  assertContains(skill, 'name: ck:auto', 'Skill frontmatter should declare ck:auto');
});

test('skill enforces spec-first approval flow', () => {
  assertContains(skill, 'Spec', 'Skill should mention Spec');
  assertContains(skill, 'approved', 'Skill should require approval before execution');
  assertContains(skill, 'safe assumptions', 'Skill should normalize vague requests with safe assumptions');
  assertContains(skill, 'do **not** ask follow-up questions', 'Skill should minimize follow-up questions after approval');
});

test('skill documents autonomous execution after approval', () => {
  assertContains(skill, 'plan', 'Skill should mention planning');
  assertContains(skill, 'implement', 'Skill should mention implementation');
  assertContains(skill, 'test', 'Skill should mention testing');
  assertContains(skill, 'verify', 'Skill should mention verification');
  assertContains(skill, 'final report', 'Skill should mention final reporting');
});

test('skill includes forge integration guidance', () => {
  assertContains(skill, 'Forge', 'Skill should mention Forge integration');
  assertContains(skill, 'todo_write', 'Skill should mention todo tracking');
  assertContains(skill, 'fs_search', 'Skill should mention codebase search');
});

test('workflow reference describes one approval gate then full execution', () => {
  assertContains(workflow, 'User runs :ck:auto with natural language request', 'Workflow should start from user request');
  assertContains(workflow, 'Normalize intent and safe assumptions', 'Workflow should normalize vague non-technical intent');
  assertContains(workflow, 'Draft Spec', 'Workflow should include spec drafting');
  assertContains(workflow, 'User approves Spec?', 'Workflow should include approval');
  assertContains(workflow, 'Inspect codebase and detect stack', 'Workflow should include codebase inspection');
  assertContains(workflow, 'Route specialist behavior or sub-agents', 'Workflow should include agent routing');
  assertContains(workflow, 'Implement incrementally', 'Workflow should include implementation');
  assertContains(workflow, 'Run strongest verification', 'Workflow should include verification');
  assertContains(workflow, 'Final report', 'Workflow should include final report');
});

console.log(`\nPassed: ${passed}`);
if (failed > 0) {
  console.log(`Failed: ${failed}`);
  process.exit(1);
}
