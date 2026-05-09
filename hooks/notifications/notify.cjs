#!/usr/bin/env node
'use strict';

/**
 * notify.cjs — Notification hook for ForgeKit
 *
 * Routes notifications to Telegram/Discord/Slack via webhook env vars.
 * Disabled by default — only sends when env vars are set.
 *
 * Usage: echo '{"event":"task-complete","message":"Done","spec":"Feature X"}' | node notify.cjs
 *
 * Env vars:
 *   FORGEKIT_TELEGRAM_BOT_TOKEN + FORGEKIT_TELEGRAM_CHAT_ID
 *   FORGEKIT_DISCORD_WEBHOOK_URL
 *   FORGEKIT_SLACK_WEBHOOK_URL
 */

const http = require('http');
const https = require('https');

// --- Crash guard ---
process.stdin.setEncoding('utf8');
let input = '';

process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    run();
  } catch {
    // Fail-open — never block on notification failure
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

  const event = data.event || data.type || '';
  const message = data.message || data.content || '';
  const spec = data.spec || data.title || 'ForgeKit';

  // Only notify on specific events
  if (!['task-complete', 'task-failed', 'task-complete', 'done', 'error'].includes(event)) {
    process.exit(0);
  }

  // Build notification text
  const icon = event.includes('fail') || event === 'error' ? '❌' : '✅';
  const text = `${icon} ForgeKit: ${spec}\n${message}`;

  // Send to all configured channels (fire-and-forget)
  sendTelegram(text);
  sendDiscord(text);
  sendSlack(text);

  process.exit(0);
}

function sendTelegram(text) {
  const botToken = process.env.FORGEKIT_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.FORGEKIT_TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const payload = JSON.stringify({ chat_id: chatId, text });
  const url = new URL(`https://api.telegram.org/bot${botToken}/sendMessage`);

  const req = https.request({
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    timeout: 5000,
  });

  req.on('error', () => {}); // Silent fail
  req.write(payload);
  req.end();
}

function sendDiscord(text) {
  const webhookUrl = process.env.FORGEKIT_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = JSON.stringify({ content: text });
  const url = new URL(webhookUrl);

  const req = https.request({
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    timeout: 5000,
  });

  req.on('error', () => {});
  req.write(payload);
  req.end();
}

function sendSlack(text) {
  const webhookUrl = process.env.FORGEKIT_SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const payload = JSON.stringify({ text });
  const url = new URL(webhookUrl);

  const req = https.request({
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    timeout: 5000,
  });

  req.on('error', () => {});
  req.write(payload);
  req.end();
}
