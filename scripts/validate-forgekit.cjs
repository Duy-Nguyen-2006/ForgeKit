#!/usr/bin/env node
'use strict';

/**
 * validate-forgekit.cjs — Schema check for forgekit.json
 *
 * Ensures:
 * 1. forgekit.json exists and is valid JSON.
 * 2. entrypoints array is exactly [":ck:auto"].
 * 3. Required top-level fields exist: schema, provider, version, behavior.
 * 4. behavior flags match contract: specFirst, singleApprovalGate, etc.
 * 5. hooks config paths are valid (file exists or .md/.cjs companion exists).
 *
 * Exit 0 on success, 1 on failure.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'forgekit.json');

let errors = 0;

function fail(msg) {
  console.error(`✗ validate-forgekit: ${msg}`);
  errors++;
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

// 1. File exists
if (!fs.existsSync(manifestPath)) {
  fail('forgekit.json not found at repo root');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (e) {
  fail(`forgekit.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

// 2. Entrypoints
if (!Array.isArray(manifest.entrypoints)) {
  fail('entrypoints must be an array');
} else if (manifest.entrypoints.length !== 1 || manifest.entrypoints[0] !== ':ck:auto') {
  fail(`entrypoints must be [":ck:auto"], got: ${JSON.stringify(manifest.entrypoints)}`);
} else {
  pass('entrypoints == [":ck:auto"]');
}

// 3. Required fields
const requiredFields = ['schema', 'provider', 'version', 'behavior'];
for (const field of requiredFields) {
  if (!(field in manifest)) {
    fail(`missing required field: ${field}`);
  } else {
    pass(`field "${field}" present`);
  }
}

// 4. Behavior contract
const behavior = manifest.behavior || {};
const behaviorChecks = [
  ['specFirst', true],
  ['singleApprovalGate', true],
  ['autonomousAfterApproval', true],
  ['verifyBeforeFinalReport', true],
  ['forgeCodeNativeFirst', true],
];

for (const [key, expected] of behaviorChecks) {
  if (behavior[key] !== expected) {
    fail(`behavior.${key} must be ${expected}, got ${behavior[key]}`);
  } else {
    pass(`behavior.${key} == ${expected}`);
  }
}

// 5. Provider
if (manifest.provider !== 'forgecode') {
  fail(`provider must be "forgecode", got "${manifest.provider}"`);
} else {
  pass('provider == "forgecode"');
}

// 6. Hooks config paths exist (allow .gitignored config files — check .md companion or example instead)
const gitignoredConfigs = ['hooks/config.json']; // These are runtime-only, created from example
const hooks = manifest.hooks || {};
for (const [hookName, hookConfig] of Object.entries(hooks)) {
  if (hookConfig.config && typeof hookConfig.config === 'string') {
    const configPath = path.join(root, hookConfig.config);
    if (fs.existsSync(configPath)) {
      pass(`hook "${hookName}" config path exists`);
    } else if (gitignoredConfigs.includes(hookConfig.config)) {
      // Config is gitignored — check that example/template exists
      const examplePath = configPath.replace(/\.json$/, '.example.json');
      if (fs.existsSync(examplePath)) {
        pass(`hook "${hookName}" config is gitignored, example template exists`);
      } else {
        fail(`hook "${hookName}" config "${hookConfig.config}" is gitignored but no example template found`);
      }
    } else {
      fail(`hook "${hookName}" config path "${hookConfig.config}" does not exist`);
    }
  }
}

// Summary
console.log('');
if (errors > 0) {
  console.error(`validate-forgekit: ${errors} error(s) found`);
  process.exit(1);
} else {
  console.log('validate-forgekit: all checks passed');
  process.exit(0);
}
