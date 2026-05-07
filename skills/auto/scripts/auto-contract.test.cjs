#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', '..', '..');
const autoSkill = fs.readFileSync(path.join(root, 'skills', 'auto', 'SKILL.md'), 'utf8');
const autoCommand = fs.readFileSync(path.join(root, 'commands', 'ck:auto.md'), 'utf8');
const orchestrator = fs.readFileSync(path.join(root, 'skills', 'orchestrator', 'SKILL.md'), 'utf8');
const tokenEfficiency = fs.readFileSync(path.join(root, 'skills', 'token-efficiency', 'SKILL.md'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'forgekit.json'), 'utf8'));

for (const text of [autoSkill, autoCommand]) {
  assert.ok(/Do not edit files/i.test(text), 'Spec gate must forbid file edits before approval');
  assert.ok(/run implementation commands/i.test(text), 'Spec gate must forbid implementation commands before approval');
  assert.ok(/After approval/i.test(text), 'Post-approval execution must be defined');
  assert.ok(/Verify|verification/i.test(text), 'Verification must be required');
}

for (const section of [
  'Mục tiêu',
  'Kết quả mong muốn',
  'Giả định an toàn',
  'Phạm vi sẽ làm',
  'Ngoài phạm vi',
  'Cách kiểm tra',
  'Tiêu chí hoàn thành',
  'Cần bạn xác nhận',
]) {
  assert.ok(autoSkill.includes(section), `auto skill missing Spec section ${section}`);
  assert.ok(autoCommand.includes(section), `auto command missing Spec section ${section}`);
}

assert.deepStrictEqual(manifest.entrypoints, [':ck:auto']);
assert.strictEqual(manifest.provider, 'forgecode');
assert.strictEqual(manifest.behavior.specFirst, true);
assert.strictEqual(manifest.behavior.singleApprovalGate, true);
assert.strictEqual(manifest.behavior.autonomousAfterApproval, true);
assert.strictEqual(manifest.behavior.verifyBeforeFinalReport, true);
assert.strictEqual(manifest.integrations.contextMode, false);
assert.strictEqual(manifest.integrations.cavemem, false);

assert.ok(orchestrator.includes('ForgeCode native tools first'), 'orchestrator must prioritize ForgeCode native tools');
assert.ok(orchestrator.includes('Serena'), 'orchestrator must include Serena routing');
assert.ok(orchestrator.includes('RTK'), 'orchestrator must include RTK routing');
assert.ok(tokenEfficiency.includes('Start with max 1 primary skill'), 'token policy must limit initial skill loading');
assert.ok(tokenEfficiency.includes('context-mode: disabled'), 'token policy must disable context-mode');
assert.ok(tokenEfficiency.includes('cavemem: disabled'), 'token policy must disable cavemem');

console.log('auto-contract.test: ok');
