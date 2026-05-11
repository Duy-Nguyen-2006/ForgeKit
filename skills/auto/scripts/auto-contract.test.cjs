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

// --- Phase 5: Runtime routing reliability assertions ---

// 5.1 route-intent.cjs must exist and export route function
const routeIntentPath = path.join(root, 'scripts', 'route-intent.cjs');
assert.ok(fs.existsSync(routeIntentPath), 'scripts/route-intent.cjs must exist');
const routeIntent = require(routeIntentPath);
assert.strictEqual(typeof routeIntent.route, 'function', 'route-intent.cjs must export route function');
assert.strictEqual(typeof routeIntent.scoreIntent, 'function', 'route-intent.cjs must export scoreIntent function');
assert.ok(Array.isArray(routeIntent.ROUTING_TABLE), 'route-intent.cjs must export ROUTING_TABLE');

// 5.2 ck:auto.md must reference routing hint
assert.ok(autoCommand.includes('route-intent.cjs'), 'ck:auto.md must reference route-intent.cjs');
assert.ok(autoCommand.includes('routing hint'), 'ck:auto.md must mention routing hint');
assert.ok(autoCommand.includes('disambiguate'), 'ck:auto.md must handle disambiguate action');
assert.ok(autoCommand.includes('no-match'), 'ck:auto.md must handle no-match action');
assert.ok(autoCommand.includes('route-log.cjs'), 'ck:auto.md must reference route-log hook');

// 5.3 eval-routing.cjs must exist
const evalRoutingPath = path.join(root, 'scripts', 'eval-routing.cjs');
assert.ok(fs.existsSync(evalRoutingPath), 'scripts/eval-routing.cjs must exist');

// 5.4 routing-fixtures.json must exist with ≥50 fixtures
const fixturesPath = path.join(root, 'tests', 'routing-fixtures.json');
assert.ok(fs.existsSync(fixturesPath), 'tests/routing-fixtures.json must exist');
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
assert.ok(Array.isArray(fixtures.fixtures), 'routing-fixtures.json must have fixtures array');
assert.ok(fixtures.fixtures.length >= 50, `routing-fixtures.json must have ≥50 fixtures (got ${fixtures.fixtures.length})`);
const viFixtures = fixtures.fixtures.filter(f => f.language === 'vi');
assert.ok(viFixtures.length >= 20, `routing-fixtures.json must have ≥20 Vietnamese fixtures (got ${viFixtures.length})`);

// 5.5 route-log.cjs must exist
const routeLogPath = path.join(root, 'hooks', 'post-tool', 'route-log.cjs');
assert.ok(fs.existsSync(routeLogPath), 'hooks/post-tool/route-log.cjs must exist');
const routeLogHookMd = path.join(root, 'hooks', 'post-tool', 'HOOK.md');
assert.ok(fs.existsSync(routeLogHookMd), 'hooks/post-tool/HOOK.md must exist');

// 5.6 route-status.cjs must exist
const routeStatusPath = path.join(root, 'scripts', 'route-status.cjs');
assert.ok(fs.existsSync(routeStatusPath), 'scripts/route-status.cjs must exist');

// 5.8 forgekit.json must have routing config
const manifestV5 = JSON.parse(fs.readFileSync(path.join(root, 'forgekit.json'), 'utf8'));
assert.ok(manifestV5.routing, 'forgekit.json must have routing section');
assert.ok(manifestV5.routing.runtimeHint, 'forgekit.json routing must have runtimeHint');
assert.strictEqual(manifestV5.routing.runtimeHint, true, 'forgekit.json routing.runtimeHint must be true');
assert.ok(manifestV5.routing.script, 'forgekit.json routing must have script path');
assert.ok(manifestV5.routing.evalScript, 'forgekit.json routing must have evalScript path');
assert.ok(manifestV5.routing.fixtures, 'forgekit.json routing must have fixtures path');
assert.ok(manifestV5.hooks.postToolRouteLog, 'forgekit.json must have postToolRouteLog hook config');

// Route-intent basic smoke tests
const testIntents = [
  { intent: 'Sửa lỗi TypeError', expected: 'fix' },
  { intent: 'Tạo API endpoint', expected: 'backend-development' },
  { intent: 'Deploy lên Vercel', expected: 'deploy' },
  { intent: 'Viết unit test', expected: 'test' },
  { intent: 'Thiết kế landing page đẹp', expected: 'ui-ux-pro-max' },
];
for (const t of testIntents) {
  const result = routeIntent.route(t.intent);
  assert.strictEqual(result.primary, t.expected, `route("${t.intent}") should return primary=${t.expected}, got ${result.primary}`);
  assert.ok(result.confidence >= 0.30, `route("${t.intent}") confidence should be ≥0.30, got ${result.confidence}`);
  assert.ok(['route', 'route-uncertain', 'disambiguate'].includes(result.action), `route("${t.intent}") action should be valid, got ${result.action}`);
}

console.log('auto-contract.test (Phase 5): ok');
