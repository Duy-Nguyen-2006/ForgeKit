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

console.log('forgecode-adapter.test: ok');
