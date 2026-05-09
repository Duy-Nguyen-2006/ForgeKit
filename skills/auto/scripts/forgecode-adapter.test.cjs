#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..', '..', '..');
const generator = path.join(root, 'scripts', 'generate-forgecode.py');
const out = path.join(root, '.forge');

execFileSync('python3', [generator, '--force'], { cwd: root, stdio: 'pipe' });

const configPath = path.join(out, 'forgekit.json');
const commandPath = path.join(out, 'commands', 'ck:auto.md');
const autoSkillPath = path.join(out, 'skills', 'auto', 'SKILL.md');
const orchestratorPath = path.join(out, 'skills', 'orchestrator', 'SKILL.md');
const tokenPath = path.join(out, 'skills', 'token-efficiency', 'SKILL.md');

assert.ok(fs.existsSync(generator), 'generate-forgecode.py should exist');
assert.ok(fs.existsSync(configPath), '.forge/forgekit.json should exist');
assert.ok(fs.existsSync(commandPath), '.forge command should exist');
assert.ok(fs.existsSync(autoSkillPath), '.forge auto skill should exist');
assert.ok(fs.existsSync(orchestratorPath), '.forge orchestrator skill should exist');
assert.ok(fs.existsSync(tokenPath), '.forge token-efficiency skill should exist');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
assert.strictEqual(config.provider, 'forgecode');
assert.strictEqual(config.nativeRuntimeDir, '.forge');
assert.deepStrictEqual(config.entrypoints, [':ck:auto']);
assert.strictEqual(config.behavior.specFirst, true);
assert.strictEqual(config.behavior.forgeCodeNativeFirst, true);
assert.strictEqual(config.integrations.contextMode, false);
assert.strictEqual(config.integrations.cavemem, false);

const command = fs.readFileSync(commandPath, 'utf8');
assert.ok(command.includes(':ck:auto'), 'ForgeCode command must use colon syntax');
assert.ok(!command.includes('Use `/ck:auto`'), 'ForgeCode native docs must not advertise slash syntax');
assert.ok(command.includes('ForgeCode native tools first'), 'command should prioritize ForgeCode native tools');
assert.ok(command.includes('Serena MCP'), 'command should mention Serena MCP');
assert.ok(command.includes('RTK'), 'command should mention RTK');

// v2.1.0 additions — verify generator copied new files into .forge/ output
assert.ok(fs.existsSync(path.join(out, 'skills', 'repo-map', 'SKILL.md')), '.forge repo-map SKILL.md exists');
assert.ok(fs.existsSync(path.join(out, 'skills', 'diff-context', 'SKILL.md')), '.forge diff-context SKILL.md exists');
assert.ok(fs.existsSync(path.join(out, 'skills', 'code-map', 'SKILL.md')), '.forge code-map SKILL.md exists');
assert.ok(fs.existsSync(path.join(out, 'skills', 'orchestrator', 'references', 'intent-classifier.md')), '.forge intent-classifier.md exists');
assert.ok(fs.existsSync(path.join(out, 'skills', 'token-efficiency', 'references', 'prompt-caching.md')), '.forge prompt-caching.md exists');
assert.ok(fs.existsSync(path.join(out, 'skills', 'scout', 'references', 'ast-grep-scouting.md')), '.forge ast-grep-scouting.md exists');
assert.ok(fs.existsSync(path.join(out, 'skills', 'auto', 'references', 'spec-template.md')), '.forge spec-template.md exists');
assert.ok(fs.existsSync(path.join(out, 'hooks', 'pre-tool', 'budget-guard.md')), '.forge budget-guard.md exists');
assert.ok(fs.existsSync(path.join(out, '.forgeignore')), '.forge .forgeignore exists');
assert.ok(fs.existsSync(path.join(out, 'integrations', 'recommended-tools.md')), '.forge recommended-tools.md exists');
assert.ok(fs.existsSync(path.join(out, 'scripts', 'build-symbol-index.sh')), '.forge scripts/build-symbol-index.sh exists');
assert.ok(fs.existsSync(path.join(out, '.mcp.json.example')), '.forge .mcp.json.example exists');

console.log('forgecode-adapter.test: ok');
