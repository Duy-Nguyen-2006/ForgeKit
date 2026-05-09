#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..', '..');
const generator = path.join(root, 'scripts', 'generate-claude.py');
const claudeDir = path.join(root, '.claude');
const claudeMd = path.join(claudeDir, 'CLAUDE.md');
const command = path.join(claudeDir, 'commands', 'ck', 'auto.md');
const autoSkill = path.join(claudeDir, 'skills', 'auto', 'SKILL.md');
const orchestrator = path.join(claudeDir, 'skills', 'orchestrator', 'SKILL.md');
const tokenEfficiency = path.join(claudeDir, 'skills', 'token-efficiency', 'SKILL.md');

execFileSync('python3', [generator, '--force'], { cwd: root, stdio: 'pipe' });

assert.ok(fs.existsSync(generator), 'generate-claude.py should exist');
assert.ok(fs.existsSync(claudeDir), '.claude directory should be generated');
assert.ok(fs.existsSync(claudeMd), 'CLAUDE.md should be generated');
assert.ok(fs.existsSync(command), '/ck:auto command should be generated');
assert.ok(fs.existsSync(autoSkill), 'auto skill should be exported to Claude runtime');
assert.ok(fs.existsSync(orchestrator), 'orchestrator skill should be exported to Claude runtime');
assert.ok(fs.existsSync(tokenEfficiency), 'token-efficiency skill should be exported to Claude runtime');

const guide = fs.readFileSync(claudeMd, 'utf8');
assert.ok(guide.includes('/ck:auto'), 'Claude guide should expose slash compatibility command');
assert.ok(guide.includes(':ck:auto'), 'Claude guide should mention ForgeCode native command');
assert.ok(guide.includes('Spec first'), 'Claude guide should preserve Spec-first behavior');
assert.ok(guide.includes('Do not use context-mode'), 'Claude guide should disable context-mode');
assert.ok(guide.includes('Do not use cavemem'), 'Claude guide should disable cavemem');

// v2.1.0 additions — verify new skills, hooks, scripts, files exported
assert.ok(fs.existsSync(path.join(claudeDir, 'skills', 'repo-map', 'SKILL.md')), 'claude repo-map skill should exist');
assert.ok(fs.existsSync(path.join(claudeDir, 'skills', 'diff-context', 'SKILL.md')), 'claude diff-context skill should exist');
assert.ok(fs.existsSync(path.join(claudeDir, 'skills', 'code-map', 'SKILL.md')), 'claude code-map skill should exist');
assert.ok(fs.existsSync(path.join(claudeDir, 'skills', 'context-engineering', 'SKILL.md')), 'claude context-engineering skill should exist');
assert.ok(fs.existsSync(path.join(claudeDir, 'hooks', 'pre-tool', 'budget-guard.md')), 'claude budget-guard hook should exist');
assert.ok(fs.existsSync(path.join(claudeDir, 'scripts', 'build-symbol-index.sh')), 'claude build-symbol-index.sh should exist');
assert.ok(fs.existsSync(path.join(claudeDir, '.forgeignore')), 'claude .forgeignore should exist');
assert.ok(fs.existsSync(path.join(claudeDir, '.mcp.json.example')), 'claude .mcp.json.example should exist');

console.log('claude-adapter.test: ok');
