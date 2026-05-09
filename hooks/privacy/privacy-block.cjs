#!/usr/bin/env node
'use strict';

/**
 * privacy-block.cjs — Privacy hook for ForgeKit
 *
 * Reads stdin JSON (tool input/output), matches against patterns.json,
 * exits with code 2 if sensitive content is detected that should be blocked.
 * Exits with code 0 if content is safe.
 *
 * Usage: echo '{"content":"..."}' | node privacy-block.cjs
 */

const fs = require('fs');
const path = require('path');

const PATTERNS_PATH = path.join(__dirname, 'patterns.json');

// --- Crash guard ---
process.stdin.setEncoding('utf8');
let input = '';

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    run();
  } catch (err) {
    // Fail-open: never crash the host process
    process.exit(0);
  }
});

function run() {
  // Load patterns
  if (!fs.existsSync(PATTERNS_PATH)) {
    // No patterns file = no blocking
    process.exit(0);
  }

  const patternsConfig = JSON.parse(fs.readFileSync(PATTERNS_PATH, 'utf8'));
  const patterns = patternsConfig.redact_patterns || [];
  const scope = patternsConfig.scope || [];
  const replacement = patternsConfig.replacement || '[REDACTED]';
  const flags = patternsConfig.pattern_flags || 'gi';

  // Parse stdin JSON
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    // Not JSON = nothing to check
    process.exit(0);
  }

  // Determine content to check
  const content = data.content || data.output || data.tool_output || data.result || '';

  if (!content || typeof content !== 'string') {
    process.exit(0);
  }

  // Check scope — only block in specific scopes
  const dataScope = data.scope || data.type || 'final-report';
  if (scope.length > 0 && !scope.includes(dataScope)) {
    // Not in blocking scope — allow but could redact in future
    process.exit(0);
  }

  // Match patterns
  const matches = [];
  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, flags);
      if (regex.test(content)) {
        matches.push(pattern);
      }
    } catch {
      // Invalid regex — skip
    }
  }

  if (matches.length > 0) {
    // Block: output what was matched and why
    process.stderr.write(
      `[privacy-block] Blocked: found ${matches.length} sensitive pattern(s) in ${dataScope}. ` +
      `Redact secrets before sharing. If this is intentional, add APPROVED: prefix.\n`
    );
    process.exit(2);
  }

  // Content is safe
  process.exit(0);
}
