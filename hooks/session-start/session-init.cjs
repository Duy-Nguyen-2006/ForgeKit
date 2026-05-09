#!/usr/bin/env node
'use strict';

/**
 * session-init.cjs — Session start hook for ForgeKit
 *
 * Prints a one-line summary of branch + dirty state when session opens.
 * Does not dump file contents. Silent unless there is useful info.
 *
 * Usage: node session-init.cjs
 * (No stdin input required — reads git status directly)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const root = findGitRoot();
  if (!root) {
    // Not a git repo — silent exit
    process.exit(0);
  }

  const repoName = path.basename(root);
  const branch = getBranch(root);
  const dirtyCount = getDirtyCount(root);
  const lastTask = getLastTask(root);

  const parts = [];
  parts.push(repoName);
  parts.push(`branch:${branch}`);
  if (dirtyCount > 0) parts.push(`${dirtyCount} file dirty`);
  if (lastTask) parts.push(`last task: ${lastTask}`);

  // Single line output to stderr (not injected into agent context)
  process.stderr.write(`[session-init] ${parts.join(' · ')}\n`);

} catch {
  // Fail-open — never block session start
}

process.exit(0);

function findGitRoot() {
  try {
    const output = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    }).trim();
    return output || null;
  } catch {
    return null;
  }
}

function getBranch(root) {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    }).trim();
  } catch {
    return 'unknown';
  }
}

function getDirtyCount(root) {
  try {
    const output = execSync('git status --porcelain', {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    }).trim();
    if (!output) return 0;
    return output.split('\n').filter(line => line.trim()).length;
  } catch {
    return 0;
  }
}

function getLastTask(root) {
  const historyPath = path.join(root, '.forge_history');
  if (!fs.existsSync(historyPath)) return null;

  try {
    const content = fs.readFileSync(historyPath, 'utf8').trim();
    const lines = content.split('\n').filter(l => l.trim());
    // Return last non-empty line, truncated to 80 chars
    if (lines.length === 0) return null;
    const last = lines[lines.length - 1];
    return last.length > 80 ? last.slice(0, 77) + '...' : last;
  } catch {
    return null;
  }
}
