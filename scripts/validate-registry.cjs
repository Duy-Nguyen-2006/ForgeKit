#!/usr/bin/env node
'use strict';

/**
 * validate-registry.cjs — Validate skills/registry.md
 *
 * Ensures:
 * 1. registry.md exists and is parseable.
 * 2. Every skill entry has trigger keywords and a valid Load path.
 * 3. Every Load path points to an existing SKILL.md file.
 * 4. Every SKILL.md has YAML frontmatter with triggers/non_triggers/examples.
 *
 * Exit 0 on success, 1 on failure.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'skills', 'registry.md');

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`✗ validate-registry: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`⚠ validate-registry: ${msg}`);
  warnings++;
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

// 1. File exists
if (!fs.existsSync(registryPath)) {
  fail('skills/registry.md not found');
  process.exit(1);
}

const registry = fs.readFileSync(registryPath, 'utf8');

// 2. Parse skill entries from markdown table
// Pattern: | skill-name | keywords | skills/xxx/SKILL.md |
const entryPattern = /^\|\s*`?([a-z0-9_-]+)`?\s*\|\s*(.+?)\s*\|\s*(skills\/\S+\/SKILL\.md)\s*\|/gm;
const entries = [];
let match;
while ((match = entryPattern.exec(registry)) !== null) {
  entries.push({
    name: match[1],
    keywords: match[2].trim(),
    loadPath: match[3].trim(),
  });
}

if (entries.length === 0) {
  fail('No skill entries found in registry.md — check table format');
} else {
  pass(`Found ${entries.length} skill entries in registry.md`);
}

// 3. Each Load path exists
const seenNames = new Set();
for (const entry of entries) {
  if (seenNames.has(entry.name)) {
    warn(`Duplicate skill name in registry: "${entry.name}"`);
  }
  seenNames.add(entry.name);

  const skillPath = path.join(root, entry.loadPath);
  if (!fs.existsSync(skillPath)) {
    fail(`Skill "${entry.name}" — Load path "${entry.loadPath}" does not exist`);
  } else {
    pass(`Skill "${entry.name}" — Load path exists`);
  }

  // Check trigger keywords are non-empty
  if (!entry.keywords || entry.keywords.length < 2) {
    fail(`Skill "${entry.name}" — trigger keywords too short or empty`);
  }
}

// 4. Every SKILL.md with frontmatter has triggers/non_triggers/examples
const skillsDir = path.join(root, 'skills');
const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'auto' && d.name !== 'orchestrator')
  .map(d => d.name);

for (const dir of skillDirs) {
  const skillMd = path.join(skillsDir, dir, 'SKILL.md');
  if (!fs.existsSync(skillMd)) {
    // Not all dirs need SKILL.md (e.g., _shared), skip
    continue;
  }

  const content = fs.readFileSync(skillMd, 'utf8');

  // Check YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    warn(`skills/${dir}/SKILL.md — no YAML frontmatter found`);
    continue;
  }

  const frontmatter = fmMatch[1];
  const hasTriggers = /triggers?:/.test(frontmatter);
  const hasNonTriggers = /non_triggers?:/.test(frontmatter);
  const hasExamples = /examples?:/.test(frontmatter);

  if (!hasTriggers) {
    fail(`skills/${dir}/SKILL.md — missing "triggers" in frontmatter`);
  } else {
    pass(`skills/${dir}/SKILL.md — has triggers`);
  }

  if (!hasNonTriggers) {
    warn(`skills/${dir}/SKILL.md — missing "non_triggers" in frontmatter`);
  }

  if (!hasExamples) {
    warn(`skills/${dir}/SKILL.md — missing "examples" in frontmatter`);
  }
}

// Summary
console.log('');
if (errors > 0) {
  console.error(`validate-registry: ${errors} error(s), ${warnings} warning(s)`);
  process.exit(1);
} else {
  console.log(`validate-registry: all checks passed (${warnings} warning(s))`);
  process.exit(0);
}
