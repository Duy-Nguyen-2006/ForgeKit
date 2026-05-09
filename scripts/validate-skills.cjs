#!/usr/bin/env node
'use strict';

/**
 * validate-skills.cjs — Validate all SKILL.md files
 *
 * Ensures:
 * 1. Every SKILL.md exists and is ≤200 lines (allowlisted exceptions for legacy skills).
 * 2. References/scripts referenced in SKILL.md exist (if path-like strings are found).
 * 3. No skill references a path that belongs to another skill incorrectly.
 *
 * Exit 0 on success, 1 on failure.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const skillsDir = path.join(root, 'skills');

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`✗ validate-skills: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`⚠ validate-skills: ${msg}`);
  warnings++;
}

function pass(msg) {
  console.log(`✓ ${msg}`);
}

const MAX_SKILL_LINES = 200; // Per plan: all SKILL.md ≤200 lines

// Allowlist for existing skills that exceed the target — must be refactored in future
const LINE_COUNT_ALLOWLIST = new Set([
  'project-organization', // 231 lines — needs split
  'mcp-management',       // 216 lines — needs split
  'fix',                  // 215 lines — needs split
  'code-review',          // 202 lines — borderline, needs trim
]);

// Get all skill directories
const dirs = fs.readdirSync(skillsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let skillCount = 0;

for (const dir of dirs) {
  const skillMd = path.join(skillsDir, dir, 'SKILL.md');
  if (!fs.existsSync(skillMd)) continue;

  skillCount++;
  const content = fs.readFileSync(skillMd, 'utf8');
  const lines = content.split('\n').length;

  // 1. Line count check
  if (lines > MAX_SKILL_LINES) {
    if (LINE_COUNT_ALLOWLIST.has(dir)) {
      warn(`skills/${dir}/SKILL.md — ${lines} lines (exceeds ${MAX_SKILL_LINES}, allowlisted for refactor)`);
    } else {
      fail(`skills/${dir}/SKILL.md — ${lines} lines (max ${MAX_SKILL_LINES})`);
    }
  } else {
    pass(`skills/${dir}/SKILL.md — ${lines} lines (≤${MAX_SKILL_LINES})`);
  }

  // 2. Check that references/ dir exists if SKILL.md mentions it
  if (content.includes('references/')) {
    const refDir = path.join(skillsDir, dir, 'references');
    if (!fs.existsSync(refDir)) {
      fail(`skills/${dir}/SKILL.md references "references/" but directory does not exist`);
    }
  }

  // 3. Check that scripts/ dir exists if SKILL.md mentions it
  // Only warn for references to the skill's own scripts/ subfolder.
  // Skip references about user-project conventions (e.g. "`scripts/`" in tables, "project's scripts/")
  const ownScriptsPattern = new RegExp(`(\\.\\/scripts\\/|skills\\/${dir}\\/scripts\\/|\\./scripts/)`, 'g');
  if (ownScriptsPattern.test(content)) {
    const scriptsDir = path.join(skillsDir, dir, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      warn(`skills/${dir}/SKILL.md references own "scripts/" directory but it does not exist`);
    }
  }

  // 4. No cross-skill path references (should not reference another skill's internal files)
  const crossRefPattern = /skills\/(?!orchestrator)([a-z0-9-]+)\/(?!SKILL\.md)/g;
  let crossMatch;
  while ((crossMatch = crossRefPattern.exec(content)) !== null) {
    const referencedSkill = crossMatch[1];
    if (referencedSkill !== dir) {
      warn(`skills/${dir}/SKILL.md references "skills/${referencedSkill}/" — cross-skill reference`);
    }
  }
}

if (skillCount === 0) {
  fail('No SKILL.md files found in skills/ directory');
} else {
  pass(`Checked ${skillCount} SKILL.md files`);
}

// Summary
console.log('');
if (errors > 0) {
  console.error(`validate-skills: ${errors} error(s), ${warnings} warning(s)`);
  process.exit(1);
} else {
  console.log(`validate-skills: all checks passed (${warnings} warning(s))`);
  process.exit(0);
}
