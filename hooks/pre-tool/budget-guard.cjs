#!/usr/bin/env node
'use strict';

/**
 * budget-guard.cjs — Pre-tool budget guard hook for ForgeKit
 *
 * Estimates token count for tool payload, exits with code 2 or
 * prints downgrade suggestion if estimated tokens exceed cap.
 *
 * Default cap: 8000 tokens (implement phase).
 * Estimation: chars / 4 (GPT tokenizer approximation).
 *
 * Usage: echo '{"tool":"read_file","content":"...","chars":50000}' | node budget-guard.cjs
 */

const DEFAULT_CAP = 8000;
const CHARS_PER_TOKEN = 4;

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
    // Fail-open
    process.exit(0);
  }
});

function run() {
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  // Determine cap from env or use default
  const cap = parseInt(process.env.FORGEKIT_BUDGET_CAP || String(DEFAULT_CAP), 10);

  // Skip tools that don't produce content
  const skipTools = ['write_file', 'Edit', 'MultiEdit', 'todo_write', 'TodoWrite', 'TodoRead'];
  const toolName = data.tool || data.tool_name || '';
  if (skipTools.some(t => toolName.includes(t))) {
    process.exit(0);
  }

  // Estimate tokens
  const content = data.content || data.input || data.payload || '';
  const chars = data.chars || data.file_size || (typeof content === 'string' ? content.length : 0);
  const estimatedTokens = Math.ceil(chars / CHARS_PER_TOKEN);

  if (estimatedTokens > cap * 1.5) {
    // Significant overshoot — block with suggestion
    process.stderr.write(
      `[budget-guard] Estimated ${estimatedTokens} tokens (cap: ${cap}). ` +
      `Suggestion: use GitNexus query/context, chunked read, or narrow scope.\n`
    );
    process.exit(2);
  }

  if (estimatedTokens > cap) {
    // Mild overshoot — warn but allow
    process.stderr.write(
      `[budget-guard] Estimated ${estimatedTokens} tokens (cap: ${cap}). ` +
      `Consider using GitNexus or chunked read.\n`
    );
    // Exit 0 = allow, but warning is logged
  }

  process.exit(0);
}
