#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execFileSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const generator = path.join(projectRoot, 'scripts', 'generate-codex.py');
const codexDir = path.join(projectRoot, '.codex');
const codexConfig = path.join(codexDir, 'codex.json');
const autoSkill = path.join(codexDir, 'skills', 'auto', 'SKILL.md');
const agentsFile = path.join(projectRoot, 'AGENTS.md');

function run() {
  execFileSync('python3', [generator, '--force'], {
    cwd: projectRoot,
    stdio: 'pipe',
    encoding: 'utf8',
  });

  assert.ok(fs.existsSync(generator), 'Codex generator script should exist');
  assert.ok(fs.existsSync(codexDir), '.codex directory should be generated');
  assert.ok(fs.existsSync(codexConfig), 'codex.json should be generated');
  assert.ok(fs.existsSync(autoSkill), 'auto skill should be exported to Codex runtime');
  assert.ok(fs.existsSync(agentsFile), 'AGENTS.md should exist for Codex CLI instructions');

  const config = JSON.parse(fs.readFileSync(codexConfig, 'utf8'));
  assert.strictEqual(config.provider, 'codex-cli');
  assert.strictEqual(config.name, 'ForgeKit');
  assert.strictEqual(config.entrypoint, '/ck:auto');
  assert.ok(Array.isArray(config.instructions), 'instructions should be an array');
  assert.ok(config.instructions.includes('AGENTS.md'), 'AGENTS.md must be included');
  assert.ok(config.instructions.includes('.codex/skills/auto/SKILL.md'), 'auto skill must be included');
  assert.strictEqual(config.behavior.specFirst, true);
  assert.strictEqual(config.behavior.singleApprovalGate, true);
  assert.strictEqual(config.behavior.autonomousAfterApproval, true);
  assert.strictEqual(config.behavior.verifyBeforeFinalReport, true);

  const skillContent = fs.readFileSync(autoSkill, 'utf8');
  assert.ok(skillContent.includes('name: ck:auto'), 'exported auto skill must keep ck:auto name');

  console.log('codex-adapter.test: ok');
}

run();
