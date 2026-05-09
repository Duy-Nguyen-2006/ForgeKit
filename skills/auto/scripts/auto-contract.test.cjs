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

// --- Phase 3: Routing assertions for 6 new domain skills ---
const registry = fs.readFileSync(path.join(root, 'skills', 'registry.md'), 'utf8');
const intentClassifier = fs.readFileSync(path.join(root, 'skills', 'orchestrator', 'references', 'intent-classifier.md'), 'utf8');

const domainSkills = [
  { name: 'auth', trigger: 'jwt', intent: 'đăng nhập' },
  { name: 'payment-integration', trigger: 'stripe', intent: 'thanh toán' },
  { name: 'web-testing', trigger: 'playwright', intent: 'e2e test' },
  { name: 'ai-multimodal', trigger: 'openai', intent: 'chatbot' },
  { name: 'document-processing', trigger: 'pdf', intent: 'parse document' },
  { name: 'browser-automation', trigger: 'scrape', intent: 'crawl' },
];

for (const skill of domainSkills) {
  // 1. SKILL.md exists
  const skillPath = path.join(root, 'skills', skill.name, 'SKILL.md');
  assert.ok(fs.existsSync(skillPath), `skills/${skill.name}/SKILL.md must exist`);

  // 2. Registry entry exists with correct name
  const registryPattern = new RegExp(`\\|\\s*${skill.name}\\s*\\|`);
  assert.ok(registryPattern.test(registry), `registry.md must list "${skill.name}" skill`);

  // 3. Registry trigger keyword present
  assert.ok(registry.includes(skill.trigger), `registry.md must contain trigger "${skill.trigger}" for ${skill.name}`);

  // 4. Intent classifier includes skill routing
  assert.ok(intentClassifier.includes(`\`${skill.name}\``), `intent-classifier.md must reference \`${skill.name}\``);

  // 5. SKILL.md has frontmatter with triggers
  const skillContent = fs.readFileSync(skillPath, 'utf8');
  const fmMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(fmMatch, `skills/${skill.name}/SKILL.md must have YAML frontmatter`);
  const frontmatter = fmMatch[1];
  assert.ok(/triggers?:/.test(frontmatter), `skills/${skill.name}/SKILL.md frontmatter must have "triggers"`);
  assert.ok(frontmatter.includes(skill.trigger), `skills/${skill.name}/SKILL.md triggers must include "${skill.trigger}"`);
}

// Verify intent classifier has domain skill patterns (Patterns 8-12)
const requiredPatterns = [
  'Pattern 8: Auth', 'Pattern 9: Payment', 'Pattern 10: Web-Testing',
  'Pattern 11: Browser-Automation', 'Pattern 12: AI-Multimodal',
];
for (const pat of requiredPatterns) {
  assert.ok(intentClassifier.includes(pat), `intent-classifier.md must include "${pat}" pattern`);
}

console.log('auto-contract.test: ok');
