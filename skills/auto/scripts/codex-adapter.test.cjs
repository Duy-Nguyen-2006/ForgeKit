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

// v2.1.0 additions — verify new skills, hooks, scripts, files exported
assert.ok(fs.existsSync(path.join(codexDir, 'skills', 'repo-map', 'SKILL.md')), 'codex repo-map skill should exist');
assert.ok(fs.existsSync(path.join(codexDir, 'skills', 'diff-context', 'SKILL.md')), 'codex diff-context skill should exist');
assert.ok(fs.existsSync(path.join(codexDir, 'skills', 'code-map', 'SKILL.md')), 'codex code-map skill should exist');
assert.ok(fs.existsSync(path.join(codexDir, 'skills', 'context-engineering', 'SKILL.md')), 'codex context-engineering skill should exist');
assert.ok(fs.existsSync(path.join(codexDir, 'hooks', 'pre-tool', 'budget-guard.md')), 'codex budget-guard hook should exist');
assert.ok(fs.existsSync(path.join(codexDir, 'scripts', 'build-symbol-index.sh')), 'codex build-symbol-index.sh should exist');
assert.ok(fs.existsSync(path.join(codexDir, '.forgeignore')), 'codex .forgeignore should exist');
assert.ok(fs.existsSync(path.join(codexDir, '.mcp.json.example')), 'codex .mcp.json.example should exist');

console.log('codex-adapter.test: ok');
