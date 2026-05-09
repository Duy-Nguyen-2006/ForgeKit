#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.resolve(path.dirname(__filename), '..');
const args = process.argv.slice(2);
const argSet = new Set(args);
const targetFlagIndex = args.findIndex((arg) => arg === '--target' || arg === '--dir');
const targetRoot = targetFlagIndex >= 0
  ? path.resolve(args[targetFlagIndex + 1] ?? '')
  : process.cwd();
const now = new Date().toISOString().replace(/[:.]/g, '-');

if (argSet.has('--help') || argSet.has('-h')) {
  console.log(`LGM MMO ForgeKit installer

Usage:
  npx lgmmo-forgekit-installer
  npx lgmmo-forgekit-installer --target ./my-project

Installs ForgeKit files into the current directory:
  .forge/agents
  .forge/commands
  .forge/skills
  .forge/integrations
  .forge/hooks
  .forge/scripts
  .forge/forgekit.json
  .forge/.mcp.json.example
  .forge/.forgeignore

Options:
  --target  Install into a specific directory
  --force   Replace existing files without backup
  --help    Show this help
`);
  process.exit(0);
}

const force = argSet.has('--force');
const entries = [
  ['agents', path.join('.forge', 'agents')],
  ['commands', path.join('.forge', 'commands')],
  ['skills', path.join('.forge', 'skills')],
  ['forgekit.json', path.join('.forge', 'forgekit.json')],
  ['AGENTS.md', path.join('.forge', 'AGENTS.md')],
  ['.forge.toml', path.join('.forge', '.forge.toml')],
  ['.mcp.json.example', path.join('.forge', '.mcp.json.example')],
  ['integrations', path.join('.forge', 'integrations')],
  ['communication', path.join('.forge', 'communication')],
  ['hooks', path.join('.forge', 'hooks')],
  ['scripts', path.join('.forge', 'scripts')],
  ['.forgeignore', path.join('.forge', '.forgeignore')],
];

function log(message) {
  console.log(`[forgekit] ${message}`);
}

function fail(message) {
  console.error(`[forgekit] ${message}`);
  process.exit(1);
}

function backupExisting(destination) {
  if (!fs.existsSync(destination)) return;
  if (force) {
    fs.rmSync(destination, { recursive: true, force: true });
    return;
  }

  const relative = path.relative(targetRoot, destination).replaceAll(path.sep, '-');
  const backup = path.join(targetRoot, `.forge-backup-${now}`, relative);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.renameSync(destination, backup);
  log(`backup ${path.relative(targetRoot, destination)} -> ${path.relative(targetRoot, backup)}`);
}

function copyEntry(source, destination) {
  backupExisting(destination);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true, errorOnExist: false });
  log(`installed ${path.relative(targetRoot, destination)}`);
}

try {
  if (targetFlagIndex >= 0 && !args[targetFlagIndex + 1]) {
    fail('--target cần path');
  }

  if (!fs.existsSync(path.join(packageRoot, 'forgekit.json'))) {
    fail('package thiếu forgekit.json');
  }

  fs.mkdirSync(path.join(targetRoot, '.forge'), { recursive: true });

  for (const [sourceRelative, destinationRelative] of entries) {
    const source = path.join(packageRoot, sourceRelative);
    const destination = path.join(targetRoot, destinationRelative);

    if (!fs.existsSync(source)) {
      fail(`package thiếu ${sourceRelative}`);
    }

    copyEntry(source, destination);
  }

  log('done');

  // Set executable bit on .cjs hook files (Unix/macOS only)
  if (process.platform !== 'win32') {
    const hooksDest = path.join(targetRoot, '.forge', 'hooks');
    try {
      const hookFiles = findFiles(hooksDest, '.cjs');
      for (const file of hookFiles) {
        fs.chmodSync(file, 0o755);
      }
      if (hookFiles.length > 0) {
        log(`set executable on ${hookFiles.length} hook file(s)`);
      }
    } catch {
      // chmod failure is non-critical
    }
  }

  log('next: mở ForgeCode trong thư mục này và dùng :ck:auto');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

function findFiles(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}
