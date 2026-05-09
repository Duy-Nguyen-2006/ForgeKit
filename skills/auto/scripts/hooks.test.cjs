#!/usr/bin/env node
'use strict';

/**
 * hooks.test.cjs — Test all ForgeKit runtime hooks
 *
 * Each hook is tested with mock input and expected exit code/output.
 * Uses child_process.spawnSync for isolated execution.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..', '..');
const hooksDir = path.join(root, 'hooks');

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

function runHook(hookPath, stdinInput, env = {}) {
  const result = spawnSync('node', [hookPath], {
    input: stdinInput,
    encoding: 'utf8',
    timeout: 10000,
    env: { ...process.env, ...env },
  });
  return {
    exitCode: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

console.log('\n=== ForgeKit hooks tests ===\n');

// --- privacy-block.cjs ---

test('privacy-block: allows safe content', () => {
  const hookPath = path.join(hooksDir, 'privacy', 'privacy-block.cjs');
  const result = runHook(hookPath, JSON.stringify({
    content: 'Hello world, this is safe content',
    scope: 'final-report',
  }));
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0, got ${result.exitCode}. stderr: ${result.stderr}`);
  }
});

test('privacy-block: blocks content with API key pattern', () => {
  const hookPath = path.join(hooksDir, 'privacy', 'privacy-block.cjs');
  const result = runHook(hookPath, JSON.stringify({
    content: 'The key is sk-abcdefghijklmnopqrstuvwxyz1234567890',
    scope: 'final-report',
  }));
  if (result.exitCode !== 2) {
    throw new Error(`Expected exit 2, got ${result.exitCode}`);
  }
});

test('privacy-block: blocks content with GitHub token pattern', () => {
  const hookPath = path.join(hooksDir, 'privacy', 'privacy-block.cjs');
  const result = runHook(hookPath, JSON.stringify({
    content: 'Use token ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh',
    scope: 'error-output',
  }));
  if (result.exitCode !== 2) {
    throw new Error(`Expected exit 2, got ${result.exitCode}`);
  }
});

test('privacy-block: allows content with secrets outside scope', () => {
  const hookPath = path.join(hooksDir, 'privacy', 'privacy-block.cjs');
  const result = runHook(hookPath, JSON.stringify({
    content: 'sk-abcdefghijklmnopqrstuvwxyz1234567890',
    scope: 'code-edit', // Not in patterns.json scope list
  }));
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0 (not in scope), got ${result.exitCode}`);
  }
});

test('privacy-block: handles non-JSON input gracefully', () => {
  const hookPath = path.join(hooksDir, 'privacy', 'privacy-block.cjs');
  const result = runHook(hookPath, 'not json at all');
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0 (fail-open), got ${result.exitCode}`);
  }
});

// --- budget-guard.cjs ---

test('budget-guard: allows small content', () => {
  const hookPath = path.join(hooksDir, 'pre-tool', 'budget-guard.cjs');
  const result = runHook(hookPath, JSON.stringify({
    tool: 'read_file',
    content: 'short content',
  }));
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0, got ${result.exitCode}`);
  }
});

test('budget-guard: blocks large content', () => {
  const hookPath = path.join(hooksDir, 'pre-tool', 'budget-guard.cjs');
  const bigContent = 'x'.repeat(50000); // ~12500 tokens
  const result = runHook(hookPath, JSON.stringify({
    tool: 'read_file',
    content: bigContent,
  }), { FORGEKIT_BUDGET_CAP: '8000' });
  if (result.exitCode !== 2) {
    throw new Error(`Expected exit 2, got ${result.exitCode}`);
  }
});

test('budget-guard: skips write tools', () => {
  const hookPath = path.join(hooksDir, 'pre-tool', 'budget-guard.cjs');
  const result = runHook(hookPath, JSON.stringify({
    tool: 'write_file',
    content: 'x'.repeat(50000),
  }));
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0 (write tool skipped), got ${result.exitCode}`);
  }
});

test('budget-guard: warns on borderline content', () => {
  const hookPath = path.join(hooksDir, 'pre-tool', 'budget-guard.cjs');
  // 36000 chars = ~9000 tokens, just over 8000 cap but under 1.5x
  const content = 'x'.repeat(36000);
  const result = runHook(hookPath, JSON.stringify({
    tool: 'read_file',
    content,
  }), { FORGEKIT_BUDGET_CAP: '8000' });
  // Should exit 0 (allow) but have warning on stderr
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0 (borderline allow), got ${result.exitCode}`);
  }
  if (!result.stderr.includes('budget-guard')) {
    throw new Error('Expected warning on stderr');
  }
});

// --- session-init.cjs ---

test('session-init: runs and exits cleanly', () => {
  const hookPath = path.join(hooksDir, 'session-start', 'session-init.cjs');
  const result = runHook(hookPath, '');
  // Should always exit 0 (fail-open)
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0, got ${result.exitCode}`);
  }
});

// --- notify.cjs ---

test('notify: skips non-matching events', () => {
  const hookPath = path.join(hooksDir, 'notifications', 'notify.cjs');
  const result = runHook(hookPath, JSON.stringify({
    event: 'session-start',
    message: 'Hello',
  }));
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0 (skipped), got ${result.exitCode}`);
  }
});

test('notify: processes task-complete event (no env vars = silent)', () => {
  const hookPath = path.join(hooksDir, 'notifications', 'notify.cjs');
  const result = runHook(hookPath, JSON.stringify({
    event: 'task-complete',
    message: 'Feature X done',
    spec: 'Build feature X',
  }));
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0, got ${result.exitCode}`);
  }
});

test('notify: handles non-JSON input gracefully', () => {
  const hookPath = path.join(hooksDir, 'notifications', 'notify.cjs');
  const result = runHook(hookPath, 'garbage input');
  if (result.exitCode !== 0) {
    throw new Error(`Expected exit 0 (fail-open), got ${result.exitCode}`);
  }
});

// Summary
console.log(`\nPassed: ${passed}`);
if (failed > 0) {
  console.log(`Failed: ${failed}`);
  process.exit(1);
}
