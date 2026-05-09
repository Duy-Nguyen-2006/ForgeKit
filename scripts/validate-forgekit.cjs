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
 * 6. README does not expose forbidden entrypoints (/ck: or :ck:non-auto).
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

// 3b. Version sync: forgekit.json version must match package.json
const pkgPath = path.join(root, 'package.json');
if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (manifest.version !== pkg.version) {
      fail(`version mismatch: forgekit.json="${manifest.version}" vs package.json="${pkg.version}" — must be identical`);
    } else {
      pass(`version sync: forgekit.json == package.json == "${manifest.version}"`);
    }
  } catch {
    // package.json parse failure is non-critical for this check
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
  // Check main config path (.cjs or .json)
  if (hookConfig.config && typeof hookConfig.config === 'string') {
    const configPath = path.join(root, hookConfig.config);
    if (fs.existsSync(configPath)) {
      pass(`hook "${hookName}" config path exists`);
    } else if (gitignoredConfigs.includes(hookConfig.config)) {
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

  // Check patterns path (for privacy hook)
  if (hookConfig.patterns && typeof hookConfig.patterns === 'string') {
    const patternsPath = path.join(root, hookConfig.patterns);
    if (fs.existsSync(patternsPath)) {
      pass(`hook "${hookName}" patterns path exists`);
    } else {
      fail(`hook "${hookName}" patterns path "${hookConfig.patterns}" does not exist`);
    }
  }

  // Check docs path
  if (hookConfig.docs && typeof hookConfig.docs === 'string') {
    const docsPath = path.join(root, hookConfig.docs);
    if (fs.existsSync(docsPath)) {
      pass(`hook "${hookName}" docs path exists`);
    } else {
      fail(`hook "${hookName}" docs path "${hookConfig.docs}" does not exist`);
    }
  }

  // Check webhookConfig path (gitignored)
  if (hookConfig.webhookConfig && typeof hookConfig.webhookConfig === 'string') {
    const wcPath = path.join(root, hookConfig.webhookConfig);
    if (fs.existsSync(wcPath)) {
      pass(`hook "${hookName}" webhookConfig path exists`);
    } else {
      const examplePath = wcPath.replace(/\.json$/, '.example.json');
      if (fs.existsSync(examplePath)) {
        pass(`hook "${hookName}" webhookConfig is gitignored, example exists`);
      } else {
        fail(`hook "${hookName}" webhookConfig "${hookConfig.webhookConfig}" not found and no example`);
      }
    }
  }
}

// 7. README guard — no non-:ck:auto entrypoints exposed to users
// Per §0.4: CI must fail if README contains /^\/ck: or /^:ck:(?!auto\b)
const readmePath = path.join(root, 'README.md');
if (fs.existsSync(readmePath)) {
  const readme = fs.readFileSync(readmePath, 'utf8');
  const forbiddenSlashCk = /^\s*\/ck:/m;
  const forbiddenCkNonAuto = /^\s*:ck:(?!auto\b)/m;
  if (forbiddenSlashCk.test(readme)) {
    fail('README contains "/ck:" entrypoint — only ":ck:auto" is allowed (§0.4)');
  }
  if (forbiddenCkNonAuto.test(readme)) {
    fail('README contains ":ck:" entrypoint other than ":ck:auto" — violates single-entrypoint principle (§0.4)');
  }
  if (!forbiddenSlashCk.test(readme) && !forbiddenCkNonAuto.test(readme)) {
    pass('README entrypoint guard — no forbidden /ck: or :ck:(non-auto) patterns');
  }
} else {
  console.warn('⚠ validate-forgekit: README.md not found — skipping entrypoint guard');
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
