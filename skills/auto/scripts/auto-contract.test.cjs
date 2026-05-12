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
assert.strictEqual(manifest.behavior.autoEnableCaveman, true);
assert.strictEqual(manifest.integrations.contextMode, false);
assert.strictEqual(manifest.integrations.cavemem, false);

assert.ok(orchestrator.includes('ForgeCode native tools first'), 'orchestrator must prioritize ForgeCode native tools');
assert.ok(orchestrator.includes('GitNexus'), 'orchestrator must include GitNexus routing');
assert.ok(tokenEfficiency.includes('GitNexus'), 'token policy must include GitNexus');
assert.ok(manifest.integrations.gitnexus, 'manifest must include GitNexus integration');
assert.ok(!manifest.integrations.serena, 'manifest must not include legacy MCP integration');
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

// 5.2 ck:auto.md must reference routing hint (MCP tool preferred, shell fallback)
assert.ok(
  autoCommand.includes('route_intent') || autoCommand.includes('route-intent.cjs'),
  'ck:auto.md must reference route_intent MCP tool or route-intent.cjs'
);
assert.ok(autoCommand.includes('routing hint'), 'ck:auto.md must mention routing hint');
assert.ok(autoCommand.includes('disambiguate'), 'ck:auto.md must handle disambiguate action');
assert.ok(autoCommand.includes('no-match'), 'ck:auto.md must handle no-match action');
assert.ok(
  autoCommand.includes('route-log.cjs') || autoCommand.includes('auto-logs'),
  'ck:auto.md must reference route logging (MCP auto-logs or manual route-log.cjs)'
);

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

// --- Phase 5.1+: Runtime router enforcement + skill auto-load constraints ---

// PR-5.1: ck:auto.md must have MANDATORY FIRST ACTION (MCP tool or shell)
assert.ok(autoCommand.includes('MANDATORY FIRST ACTION') || autoCommand.includes('MANDATORY'), 'ck:auto.md must have MANDATORY routing step');
assert.ok(
  autoCommand.includes('route_intent') || autoCommand.includes('route-intent.cjs'),
  'ck:auto.md must reference route_intent MCP tool or route-intent.cjs as mandatory step'
);
assert.ok(autoCommand.includes('DO NOT SKIP'), 'ck:auto.md must warn DO NOT SKIP for routing step');

// PR-5.1: auto/SKILL.md must reference routing as MANDATORY FIRST (MCP tool or shell)
assert.ok(autoSkill.includes('MANDATORY FIRST') || autoSkill.includes('MANDATORY'), 'auto/SKILL.md must have MANDATORY routing step');
assert.ok(
  autoSkill.includes('route_intent') || autoSkill.includes('route-intent.cjs'),
  'auto/SKILL.md must reference route_intent MCP tool or route-intent.cjs'
);

// PR-5.2: ck:auto must have auto_load: true
const autoFmMatch = autoSkill.match(/^---\n([\s\S]*?)\n---/);
assert.ok(autoFmMatch, 'auto/SKILL.md must have YAML frontmatter');
const autoFrontmatter = autoFmMatch[1];
assert.ok(/auto_load:\s*true/.test(autoFrontmatter), 'auto/SKILL.md must have auto_load: true');

// PR-5.2: All non-auto skills must have auto_load: false
const skillsDir = path.join(root, 'skills');
const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'auto')
  .map(d => d.name);

for (const dir of skillDirs) {
  const skillMd = path.join(skillsDir, dir, 'SKILL.md');
  if (!fs.existsSync(skillMd)) continue;

  const content = fs.readFileSync(skillMd, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;

  const frontmatter = fmMatch[1];
  assert.ok(
    /auto_load:\s*false/.test(frontmatter),
    `skills/${dir}/SKILL.md must have auto_load: false (PR-5.2: prevent unwanted auto-load)`
  );
}

// PR-5.2: Description length check (≤80 chars for non-auto skills)
for (const dir of skillDirs) {
  const skillMd = path.join(skillsDir, dir, 'SKILL.md');
  if (!fs.existsSync(skillMd)) continue;

  const content = fs.readFileSync(skillMd, 'utf8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;

  const frontmatter = fmMatch[1];
  const descMatch = frontmatter.match(/description:\s*["']?(.+?)["']?\s*$/m);
  if (descMatch) {
    const desc = descMatch[1].trim();
    assert.ok(
      desc.length <= 80,
      `skills/${dir}/SKILL.md description too long (${desc.length} chars, max 80): "${desc.substring(0, 40)}..."`
    );
  }
}

// PR-5.3: token-efficiency must mention auto_load constraint and description length rule
assert.ok(tokenEfficiency.includes('auto_load: false'), 'token-efficiency must mention auto_load: false constraint');
assert.ok(tokenEfficiency.includes('≤80'), 'token-efficiency must mention description ≤80 chars rule');
assert.ok(tokenEfficiency.includes('route-intent.cjs'), 'token-efficiency must reference route-intent.cjs for skill loading');

// PR-5.1: ck:auto.md must enforce "Max 1 primary skill initially" 
assert.ok(autoCommand.includes('maxPrimarySkillsInitial') || autoCommand.includes('1 primary skill'), 'ck:auto.md must enforce 1 primary skill limit');

// PR-5.1: ck:auto.md must NOT allow auto-loading skills based on keyword matching
assert.ok(autoCommand.includes('auto-load') || autoCommand.includes('auto_load'), 'ck:auto.md must mention auto-load constraint');

console.log('auto-contract.test (Phase 5.1+): ok');

// --- Phase 5.2: MCP Server assertions ---

// MCP server directory must exist
const mcpServerDir = path.join(root, 'mcp-server');
assert.ok(fs.existsSync(mcpServerDir), 'mcp-server/ directory must exist');

// MCP server entry point must exist
const mcpIndex = path.join(mcpServerDir, 'index.cjs');
assert.ok(fs.existsSync(mcpIndex), 'mcp-server/index.cjs must exist');

// MCP server package.json must exist with correct name
const mcpPkg = path.join(mcpServerDir, 'package.json');
assert.ok(fs.existsSync(mcpPkg), 'mcp-server/package.json must exist');
const mcpPkgData = JSON.parse(fs.readFileSync(mcpPkg, 'utf8'));
assert.ok(mcpPkgData.name.includes('forgekit'), 'mcp-server package name must include "forgekit"');
assert.ok(mcpPkgData.dependencies['@modelcontextprotocol/sdk'], 'mcp-server must depend on @modelcontextprotocol/sdk');

// .mcp.json must exist and reference forgekit-router
const mcpJsonPath = path.join(root, '.mcp.json');
assert.ok(fs.existsSync(mcpJsonPath), '.mcp.json must exist');
const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
assert.ok(mcpJson.mcpServers, '.mcp.json must have mcpServers');
assert.ok(mcpJson.mcpServers['forgekit-router'], '.mcp.json must have forgekit-router server config');
assert.ok(
  mcpJson.mcpServers['forgekit-router'].command === 'node',
  'forgekit-router must use node command'
);
assert.ok(
  mcpJson.mcpServers['forgekit-router'].args.includes('mcp-server/index.cjs'),
  'forgekit-router args must include mcp-server/index.cjs'
);

// ck:auto.md must prefer route_intent MCP tool over shell command
assert.ok(
  autoCommand.includes('route_intent') && autoCommand.includes('MCP tool'),
  'ck:auto.md must reference route_intent as MCP tool (primary method)'
);
assert.ok(
  autoCommand.includes('Fallback') || autoCommand.includes('fallback'),
  'ck:auto.md must include shell fallback for non-MCP environments'
);

// auto/SKILL.md must reference route_intent MCP tool
assert.ok(
  autoSkill.includes('route_intent'),
  'auto/SKILL.md must reference route_intent MCP tool'
);

console.log('auto-contract.test (Phase 5.2 MCP): ok');
