#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const forgeDir = path.join(root, '.forge');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoActiveSerena() {
  const activeFiles = [
    '.mcp.json',
    '.mcp.json.example',
    'forgekit.json',
    'AGENTS.md',
    'commands/ck:auto.md',
    'skills/auto/SKILL.md',
    'skills/orchestrator/SKILL.md',
    'skills/token-efficiency/SKILL.md',
  ];

  for (const rel of activeFiles) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, 'utf8');
    assert(!/serena/i.test(content), `${rel} must not reference Serena`);
  }
}

function assertRuntimeConfig() {
  const manifest = readJson('forgekit.json');
  assert(manifest.integrations.rtk, 'forgekit.json must include RTK integration');
  assert(manifest.integrations.gitnexus, 'forgekit.json must include GitNexus integration');
  assert(!manifest.integrations.serena, 'forgekit.json must not include Serena integration');
  assert(manifest.behavior.autoEnableCaveman === true, 'forgekit.json must auto-enable Caveman');

  const mcpExample = fs.readFileSync(path.join(root, '.mcp.json.example'), 'utf8');
  assert(/gitnexus/i.test(mcpExample), '.mcp.json.example must include GitNexus');
  assert(!/serena/i.test(mcpExample), '.mcp.json.example must not include Serena');
}

function assertForgeExport() {
  execFileSync('python3', ['scripts/generate-forgecode.py', '--force'], {
    cwd: root,
    stdio: 'inherit',
  });

  const exportManifest = JSON.parse(fs.readFileSync(path.join(forgeDir, 'forgekit.json'), 'utf8'));
  assert(exportManifest.nativeRuntimeDir === '.forge', '.forge/forgekit.json must use .forge runtime dir');
  assert(exportManifest.integrations.rtk, '.forge/forgekit.json must include RTK integration');
  assert(exportManifest.integrations.gitnexus, '.forge/forgekit.json must include GitNexus integration');
  assert(!exportManifest.integrations.serena, '.forge/forgekit.json must not include Serena integration');
  assert(exportManifest.behavior.autoEnableCaveman === true, '.forge/forgekit.json must auto-enable Caveman');
}

assertNoActiveSerena();
assertRuntimeConfig();
assertForgeExport();
console.log('validate-forgecode-compat: ok');
