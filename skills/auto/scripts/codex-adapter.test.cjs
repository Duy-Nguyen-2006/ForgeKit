#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..', '..');
const generator = path.join(root, 'scripts', 'generate-codex.py');
const codexDir = path.join(root, '.codex');
const codexConfig = path.join(codexDir, 'codex.json');
const autoSkill = path.join(codexDir, 'skills', 'auto', 'SKILL.md');
const orchestrator = path.join(codexDir, 'skills', 'orchestrator', 'SKILL.md');
const tokenEfficiency = path.join(codexDir, 'skills', 'token-efficiency', 'SKILL.md');

execFileSync('python3', [generator, '--force'], { cwd: root, stdio: 'pipe' });

assert.ok(fs.existsSync(generator), 'generate-codex.py should exist');
assert.ok(fs.existsSync(codexDir), '.codex directory should be generated');
assert.ok(fs.existsSync(codexConfig), 'codex.json should be generated');
assert.ok(fs.existsSync(autoSkill), 'auto skill should be exported to Codex runtime');
assert.ok(fs.existsSync(orchestrator), 'orchestrator skill should be exported to Codex runtime');
assert.ok(fs.existsSync(tokenEfficiency), 'token-efficiency skill should be exported to Codex runtime');
assert.ok(fs.existsSync(path.join(root, 'AGENTS.md')), 'AGENTS.md should exist for Codex CLI instructions');

const config = JSON.parse(fs.readFileSync(codexConfig, 'utf8'));
assert.strictEqual(config.provider, 'codex-cli');
assert.strictEqual(config.name, 'ForgeKit');
assert.strictEqual(config.entrypoint, '/ck:auto');
assert.strictEqual(config.nativeEntrypoint, ':ck:auto');
assert.ok(config.instructions.includes('AGENTS.md'), 'AGENTS.md must be included');
assert.ok(config.instructions.includes('.codex/skills/auto/SKILL.md'), 'auto skill must be included');
assert.strictEqual(config.behavior.specFirst, true);
assert.strictEqual(config.behavior.singleApprovalGate, true);
assert.strictEqual(config.behavior.autonomousAfterApproval, true);
assert.strictEqual(config.behavior.verifyBeforeFinalReport, true);

const skillContent = fs.readFileSync(autoSkill, 'utf8');
assert.ok(skillContent.includes('name: ck:auto'), 'exported auto skill must keep ck:auto name');

console.log('codex-adapter.test: ok');
