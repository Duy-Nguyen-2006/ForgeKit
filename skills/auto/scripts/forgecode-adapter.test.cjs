#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../../../..');
const SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'generate-forgecode.py');
const NATIVE_OUTPUT_DIR = path.join(PROJECT_ROOT, '.forge');
const COMPAT_OUTPUT_DIR = path.join(PROJECT_ROOT, '.forgecode');
const FORGE_MD = path.join(PROJECT_ROOT, 'FORGE.md');
const NATIVE_CONFIG_PATH = path.join(NATIVE_OUTPUT_DIR, 'forgekit.json');
const COMPAT_CONFIG_PATH = path.join(COMPAT_OUTPUT_DIR, 'forgecode.json');
const AUTO_COMMAND_PATH = path.join(NATIVE_OUTPUT_DIR, 'commands', 'ck:auto.md');
const AUTO_SKILL_PATH = path.join(NATIVE_OUTPUT_DIR, 'skills', 'auto', 'SKILL.md');

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

console.log('\n=== ForgeCode adapter tests ===\n');

execFileSync('python3', [SCRIPT_PATH, '--force'], {
  cwd: PROJECT_ROOT,
  stdio: 'pipe',
});

const forgeMd = readUtf8(FORGE_MD);
const nativeConfig = JSON.parse(readUtf8(NATIVE_CONFIG_PATH));
const compatConfig = JSON.parse(readUtf8(COMPAT_CONFIG_PATH));
const autoSkill = readUtf8(AUTO_SKILL_PATH);

const expectedCompatDirs = ['agents', 'hooks', 'rules', 'scripts', 'skills'];
const expectedNativeDirs = ['agents', 'commands', 'skills'];

test('generator script exists', () => {
  assertTrue(fs.existsSync(SCRIPT_PATH), 'generate-forgecode.py should exist');
});

test('FORGE.md is generated', () => {
  assertTrue(fs.existsSync(FORGE_MD), 'FORGE.md should be generated');
  assertContains(forgeMd, ':ck:auto', 'FORGE.md should document native :ck:auto');
  assertContains(forgeMd, 'ForgeCode reserves `/...`', 'FORGE.md should warn that / is reserved');
  assertContains(forgeMd, 'spec', 'FORGE.md should mention spec-first flow');
});

test('.forge native config is generated', () => {
  assertTrue(fs.existsSync(NATIVE_CONFIG_PATH), '.forge/forgekit.json should exist');
  assertTrue(nativeConfig.provider === 'forgecode', 'Native config provider should be forgecode');
  assertTrue(nativeConfig.nativeRuntimeDir === '.forge', 'Native runtime dir should be .forge');
  assertTrue(nativeConfig.entrypoints.includes(':ck:auto'), 'Native config should expose :ck:auto');
});

test('.forgecode compatibility config is generated', () => {
  assertTrue(fs.existsSync(COMPAT_CONFIG_PATH), '.forgecode/forgecode.json should exist');
  assertTrue(compatConfig.provider === 'forgecode', 'Compat config provider should be forgecode');
  assertTrue(compatConfig.entrypoint === ':ck:auto', 'Compat config entrypoint should be native :ck:auto');
  assertTrue(compatConfig.behavior.autonomousAfterApproval === true, 'Compat config should mark autonomous execution');
});

test('expected native and compatibility runtime directories are generated', () => {
  for (const dir of expectedNativeDirs) {
    assertTrue(fs.existsSync(path.join(NATIVE_OUTPUT_DIR, dir)), `Expected native directory: ${dir}`);
  }
  for (const dir of expectedCompatDirs) {
    assertTrue(fs.existsSync(path.join(COMPAT_OUTPUT_DIR, dir)), `Expected compat directory: ${dir}`);
  }
});

test('native Forge command and skill are generated', () => {
  assertTrue(fs.existsSync(AUTO_COMMAND_PATH), 'Native :ck:auto command should exist');
  const autoCommand = readUtf8(AUTO_COMMAND_PATH);
  assertContains(autoCommand, 'name: ck:auto', 'Native command should define ck:auto');
  assertContains(autoCommand, '## Non-Negotiable Contract', 'Native command should enforce the autopilot contract');
  assertContains(autoCommand, 'safe assumptions', 'Native command should normalize vague requests');
  assertContains(autoCommand, 'Route work to the right capability', 'Native command should route specialist behavior');
  assertTrue(fs.existsSync(AUTO_SKILL_PATH), 'Native auto skill should exist');
  assertContains(readUtf8(AUTO_SKILL_PATH), 'name: ck:auto', 'Native skill should preserve ck:auto frontmatter');
  assertContains(readUtf8(AUTO_SKILL_PATH), 'ForgeCode Integration Rules', 'Native skill should preserve ForgeCode guidance');
});

console.log(`\nPassed: ${passed}`);
if (failed > 0) {
  console.log(`Failed: ${failed}`);
  process.exit(1);
}
