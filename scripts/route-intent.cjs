#!/usr/bin/env node
'use strict';

/**
 * route-intent.cjs — Deterministic intent-to-skill router for ForgeKit
 *
 * Phase 5.1: Runtime routing reliability
 *
 * This script provides a CODE-ENFORCED routing hint that complements the
 * prompt-based orchestrator. It parses the user's intent string, matches
 * against a keyword-weighted routing table, and outputs a JSON routing hint.
 *
 * Usage:
 *   node scripts/route-intent.cjs "Sửa lỗi TypeError ở file user.ts"
 *   echo '{"intent":"Fix failing test"}' | node scripts/route-intent.cjs --stdin
 *   node scripts/route-intent.cjs --json '{"intent":"Tạo API endpoint GET /users"}'
 *
 * Output (stdout):
 *   {
 *     "intent": "Sửa lỗi TypeError ở file user.ts",
 *     "primary": "fix",
 *     "secondary": ["ck-debug"],
 *     "confidence": 0.95,
 *     "gap": 0.25,
 *     "action": "route",
 *     "matchedKeywords": { "fix": ["sửa", "lỗi"], "ck-debug": ["lỗi"] },
 *     "verb": "sửa"
 *   }
 *
 * Exit codes:
 *   0 — success (routing hint produced)
 *   1 — error
 *   2 — no match (confidence < 0.30 for all skills)
 */

const fs = require('fs');
const path = require('path');

// ─── Routing Table ────────────────────────────────────────────────
// Each entry: { skill, verbs, nouns, secondary, category }
// Keywords are lowercase. Vietnamese diacritics included for matching.
// Verbs carry higher weight than nouns (động từ chính > danh từ phụ)

const ROUTING_TABLE = [
  // ── Quality ──
  {
    skill: 'fix',
    category: 'quality',
    verbs: ['fix', 'sửa', 'khắc phục', 'resolve', 'patch', 'sửa nhanh', 'quick fix', 'sửa hết', 'sửa lỗi'],
    nouns: ['broken', 'type error', 'lint error', 'failing test', 'lỗi', 'typeerror', 'crash khi', 'error', 'type error khi build', 'bug', 'ui bug'],
    secondary: ['ck-debug', 'test'],
  },
  {
    skill: 'ck-debug',
    category: 'quality',
    verbs: ['debug', 'tìm lỗi', 'investigate', 'diagnose', 'tìm root cause', 'tại sao', 'why', 'không chạy được', 'không chạy', 'investigate memory', 'app crash', 'không chạy được app'],
    nouns: ['root cause', 'memory leak', 'không chạy được', 'không hiểu', 'app crash', 'crash khi bấm', 'crash khi', 'ci fail', 'lỗi', 'nguyên nhân', 'crash khi submit'],
    secondary: ['fix', 'test'],
  },
  {
    skill: 'test',
    category: 'quality',
    verbs: ['viết test', 'chạy test', 'kiểm thử', 'add test', 'coverage', 'viết unit test', 'tăng test coverage', 'chạy thử', 'add e2e test'],
    nouns: ['unit test', 'vitest', 'jest', 'coverage', 'e2e', 'integration test', 'chạy thử', 'test coverage', 'e2e test cho login'],
    secondary: [],
  },
  {
    skill: 'code-review',
    category: 'quality',
    verbs: ['review', 'kiểm tra code', 'audit code', 'check quality', 'check code', 'refactor', 'review code', 'review rồi'],
    nouns: ['quality', 'best practice', 'maintainability', 'clean up', 'code quality'],
    secondary: ['scout'],
  },

  // ── Development ──
  {
    skill: 'backend-development',
    category: 'development',
    verbs: ['tạo api', 'add endpoint', 'implement service', 'viết middleware', 'setup websocket', 'implement rate', 'tạo rest api', 'tạo api endpoint', 'viết middleware validate'],
    nouns: ['api', 'server', 'endpoint', 'middleware', 'service', 'rate limiting', 'rest api', 'crud', 'backend', 'request body'],
    secondary: ['databases', 'security-scan'],
  },
  {
    skill: 'frontend-development',
    category: 'development',
    verbs: ['tạo component', 'build component', 'add component', 'tạo form', 'build hook', 'add hook', 'add dark mode', 'tạo form đăng ký', 'build react hook'],
    nouns: ['component', 'react', 'vue', 'page', 'hook', 'state', 'render', 'props', 'client ui', 'validation', 'form', 'dark mode', 'data fetching', 'react hook cho'],
    secondary: ['ui-ux-pro-max'],
  },
  {
    skill: 'ui-ux-pro-max',
    category: 'development',
    verbs: ['thiết kế', 'design', 'làm đẹp', 'tạo landing', 'make responsive', 'make the dashboard responsive', 'thiết kế landing page'],
    nouns: ['ui', 'ux', 'giao diện', 'responsive', 'layout', 'color', 'spacing', 'animation', 'web đẹp', 'landing page', 'đẹp', 'dashboard responsive'],
    secondary: ['frontend-development'],
  },
  {
    skill: 'databases',
    category: 'development',
    verbs: ['tạo migration', 'tối ưu query', 'add index', 'viết aggregation', 'tạo migration thêm', 'setup postgresql', 'setup schema'],
    nouns: ['schema', 'migration', 'query', 'postgres', 'postgresql', 'mongo', 'mongodb', 'index', 'table', 'database', 'sql', 'aggregation pipeline', 'query chậm', 'bảng', 'cột'],
    secondary: ['backend-development'],
  },
  {
    skill: 'web-frameworks',
    category: 'development',
    verbs: ['setup next.js', 'config vite', 'migrate turborepo', 'setup app router', 'setup nextjs', 'migrate sang turborepo', 'config vite cho react', 'setup next.js app'],
    nouns: ['next.js', 'nextjs', 'nuxt', 'remix', 'vite', 'ssr', 'app router', 'turborepo', 'react project', 'next.js app router'],
    secondary: ['frontend-development'],
  },

  // ── Operations ──
  {
    skill: 'deploy',
    category: 'operations',
    verbs: ['deploy', 'publish', 'ship', 'đưa lên', 'đẩy lên server', 'host', 'deploy lên', 'publish package', 'setup ci/cd', 'setup ci', 'deploy và', 'config docker'],
    nouns: ['hosting', 'ci/cd', 'ci', 'cd', 'docker', 'production', 'vercel', 'netlify', 'railway', 'flyio', 'aws', 'gcp', 'npm', 'server', 'docker cho production'],
    secondary: ['security-scan'],
  },
  {
    skill: 'git',
    category: 'operations',
    verbs: ['commit', 'push', 'merge', 'tạo pr', 'lưu lại', 'commit với'],
    nouns: ['branch', 'pull request', 'pr', 'conventional commit', 'đẩy code', 'merge feature', 'cypress'],
    secondary: ['code-review'],
  },
  {
    skill: 'security-scan',
    category: 'operations',
    verbs: ['scan', 'audit', 'kiểm tra bảo mật', 'bảo mật', 'kiểm tra có lộ'],
    nouns: ['security', 'vulnerability', 'injection', 'secret', 'owasp', 'bảo mật', 'lộ secret', 'vulnerability trong', 'owasp cho'],
    secondary: ['backend-development'],
  },
  {
    skill: 'mcp-management',
    category: 'operations',
    verbs: ['setup mcp', 'config tool', 'tích hợp tool', 'setup mcp tool'],
    nouns: ['mcp', 'tool config', 'integration', 'external tool', 'server config', 'mcp tool'],
    secondary: [],
  },

  // ── Project ──
  {
    skill: 'scout',
    category: 'project',
    verbs: ['explore', 'tìm hiểu', 'inspect', 'tìm hiểu codebase', 'explore codebase', 'codebase này có gì'],
    nouns: ['codebase mới', 'chưa biết', 'có gì', 'sơ đồ project', 'luồng code', 'chưa biết bắt đầu', 'codebase này có gì', 'chưa biết bắt đầu đâu'],
    secondary: ['ask'],
  },
  {
    skill: 'context-engineering',
    category: 'project',
    verbs: ['tìm function', 'tìm symbol', 'tìm reference', 'find usages', 'tìm tất cả file dùng', 'tìm class', 'tìm reference của'],
    nouns: ['symbol', 'cross-file', 'unfamiliar repo', 'sơ đồ codebase', 'refactor cross-file', 'handle submit', 'user service', 'function', 'class'],
    secondary: [],
  },
  {
    skill: 'diff-context',
    category: 'project',
    verbs: ['xem diff', 'so sánh', 'compare', 'thay đổi gì'],
    nouns: ['diff', 'thay đổi gì', 'what changed', 'changed files', 'patch context', 'thay đổi', 'so sánh branch', 'diff giữa'],
    secondary: ['git'],
  },
  {
    skill: 'ask',
    category: 'project',
    verbs: ['hỏi', 'clarify', 'chưa rõ'],
    nouns: ['thiếu thông tin', 'mơ hồ', 'không biết bắt đầu', 'ambiguous', 'không rõ'],
    secondary: [],
  },
  {
    skill: 'watzup',
    category: 'project',
    verbs: ['xem tiến độ', 'check status', 'chạy watzup'],
    nouns: ['watzup', 'status', 'tiến độ', 'đang làm gì'],
    secondary: [],
  },
  {
    skill: 'repomix',
    category: 'project',
    verbs: ['tóm tắt codebase', 'tóm tắt codebase cho'],
    nouns: ['repomix', 'codebase summary', 'tóm tắt code', 'ai context'],
    secondary: [],
  },
  {
    skill: 'repo-map',
    category: 'project',
    verbs: ['map repo', 'map structure', 'map toàn bộ', 'map project'],
    nouns: ['repo map', 'skeleton map', 'folder structure', 'sơ đồ repo', 'repomap', 'directory tree', 'project structure', 'sơ đồ project'],
    secondary: [],
  },
  {
    skill: 'code-map',
    category: 'project',
    verbs: ['xem luồng code', 'map code flow', 'map code flow từ'],
    nouns: ['code map', 'code2prompt', 'gitingest', 'code flow', 'call chain', 'luồng code', 'request đến response'],
    secondary: ['context-engineering'],
  },
  {
    skill: 'project-organization',
    category: 'project',
    verbs: ['tổ chức lại', 'reorganize', 'restructure', 'tổ chức lại folder'],
    nouns: ['structure', 'folder', 'organize', 'layout', 'folder structure'],
    secondary: [],
  },
  {
    skill: 'docs',
    category: 'project',
    verbs: ['viết tài liệu', 'viết docs', 'viết readme', 'update docs', 'viết readme cho', 'update api documentation', 'viết tài liệu cho'],
    nouns: ['tài liệu', 'readme', 'docs', 'documentation', 'guide', 'changelog', 'api docs', 'api documentation', 'documentation cho'],
    secondary: [],
  },

  // ── Domain ──
  {
    skill: 'auth',
    category: 'domain',
    verbs: ['đăng nhập', 'đăng ký', 'signup', 'login', 'thêm đăng nhập', 'thêm authentication', 'implement oauth', 'setup session'],
    nouns: ['jwt', 'oauth', 'oauth2', 'session', 'authentication', 'authorization', 'rbac', 'google login', 'session management'],
    secondary: ['backend-development'],
  },
  {
    skill: 'payment-integration',
    category: 'domain',
    verbs: ['thanh toán', 'setup billing', 'add checkout', 'add stripe', 'tích hợp thanh toán', 'setup recurring'],
    nouns: ['stripe', 'paypal', 'momo', 'vnpay', 'checkout', 'subscription', 'payment', 'trả tiền', 'checkout flow', 'billing', 'recurring billing'],
    secondary: ['backend-development'],
  },
  {
    skill: 'web-testing',
    category: 'domain',
    verbs: ['viết e2e test', 'browser test', 'visual regression test', 'setup cypress', 'write playwright', 'thêm e2e test', 'setup cypress cho', 'add e2e test cho'],
    nouns: ['playwright', 'cypress', 'e2e test', 'browser test', 'visual regression', 'test trên browser', 'e2e test cho', 'playwright tests', 'playwright tests for', 'cypress cho'],
    secondary: [],
  },
  {
    skill: 'ai-multimodal',
    category: 'domain',
    verbs: ['tích hợp ai', 'setup chatbot', 'add image generation', 'setup voice', 'integrate openai', 'thêm image generation'],
    nouns: ['openai', 'anthropic', 'gemini', 'chatbot', 'ai integration', 'vision', 'embedding', 'dall-e', 'whisper', 'chat api', 'image generation', 'voice transcription', 'image generation với dall', 'voice transcription'],
    secondary: ['backend-development'],
  },
  {
    skill: 'document-processing',
    category: 'domain',
    verbs: ['parse document', 'extract text', 'generate report', 'đọc docx', 'xử lý pdf', 'generate excel'],
    nouns: ['pdf', 'docx', 'xlsx', 'pptx', 'xuất excel', 'xử lý pdf', 'excel report', 'docx template', 'parse pdf'],
    secondary: [],
  },
  {
    skill: 'browser-automation',
    category: 'domain',
    verbs: ['scrape', 'crawl', 'cào dữ liệu', 'automate browser', 'crawl website', 'scrape product'],
    nouns: ['headless', 'automate browser', 'data extraction', 'puppeteer', 'screenshot', 'take screenshots', 'extract links'],
    secondary: [],
  },

  // ── Core ──
  {
    skill: 'coding-level',
    category: 'core',
    verbs: ['giải thích', 'explain', 'describe', 'giải thích code', 'explain the'],
    nouns: ['đơn giản', 'how it works', 'technical detail', 'non-tech', 'auth flow simply'],
    secondary: [],
  },
];

// ─── Scoring Constants ────────────────────────────────────────────
const VERB_WEIGHT = 0.35;
const NOUN_WEIGHT = 0.25;
const SINGLE_MATCH_BONUS = 0.15;
const REGISTRY_KEYWORD_BONUS = 0.10;
const CONTEXT_MATCH_BONUS = 0.15;

// Confidence thresholds
const CONFIDENCE_ROUTE_DIRECT = 0.90;
const CONFIDENCE_ROUTE_WITH_SECONDARY = 0.75;
const CONFIDENCE_UNCERTAIN = 0.60;
const CONFIDENCE_NO_MATCH = 0.30;
const GAP_THRESHOLD = 0.15;

// Decay factors
const LONG_INTENT_PENALTY = 0.05;  // > 50 words
const MULTI_GROUP_PENALTY = 0.10;   // 3+ different category keywords
const NO_VERB_PENALTY = 0.10;       // no verb detected

// ─── Normalization ────────────────────────────────────────────────

function normalize(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')  // keep letters/numbers/spaces
    .replace(/\s+/g, ' ');
}

// ─── Keyword Matching ─────────────────────────────────────────────

function matchesKeywords(intentNorm, keywords) {
  const hits = [];
  for (const kw of keywords) {
    if (intentNorm.includes(kw.toLowerCase())) {
      hits.push(kw);
    }
  }
  return hits;
}

// ─── Verb Detection ───────────────────────────────────────────────

function detectVerb(intentNorm) {
  // Try longest match first to avoid partial matches
  const allVerbs = [];
  for (const entry of ROUTING_TABLE) {
    for (const v of entry.verbs) {
      allVerbs.push({ verb: v, skill: entry.skill });
    }
  }
  // Sort by length descending for greedy matching
  allVerbs.sort((a, b) => b.verb.length - a.verb.length);

  for (const { verb, skill } of allVerbs) {
    if (intentNorm.includes(verb.toLowerCase())) {
      return { verb, skill };
    }
  }
  return null;
}

// ─── Category Detection ───────────────────────────────────────────

function getSkillCategory(skillName) {
  const entry = ROUTING_TABLE.find(e => e.skill === skillName);
  return entry ? entry.category : null;
}

// ─── Scoring ──────────────────────────────────────────────────────

function scoreIntent(intent) {
  const intentNorm = normalize(intent);
  const verbInfo = detectVerb(intentNorm);
  const wordCount = intentNorm.split(/\s+/).filter(Boolean).length;

  const results = [];

  for (const entry of ROUTING_TABLE) {
    let confidence = 0;
    const matchedVerbs = matchesKeywords(intentNorm, entry.verbs);
    const matchedNouns = matchesKeywords(intentNorm, entry.nouns);

    // Verb match
    if (matchedVerbs.length > 0) {
      confidence += VERB_WEIGHT;
      // Bonus for multiple verb matches
      if (matchedVerbs.length >= 2) {
        confidence += 0.05;
      }
    }

    // Noun match
    if (matchedNouns.length > 0) {
      confidence += NOUN_WEIGHT;
      // Bonus for multiple noun matches
      if (matchedNouns.length >= 2) {
        confidence += 0.05;
      }
    }

    // Single skill clear (only this skill matched verbs)
    if (matchedVerbs.length > 0) {
      const otherVerbMatches = ROUTING_TABLE.filter(
        other => other.skill !== entry.skill && matchesKeywords(intentNorm, other.verbs).length > 0
      );
      if (otherVerbMatches.length === 0) {
        confidence += SINGLE_MATCH_BONUS;
      }
    }

    // Registry keyword bonus (multiple nouns from different categories match)
    if (matchedNouns.length >= 2) {
      confidence += REGISTRY_KEYWORD_BONUS;
    }

    // Context match (verb+noun both match same skill)
    if (matchedVerbs.length > 0 && matchedNouns.length > 0) {
      confidence += CONTEXT_MATCH_BONUS;
    }

    // Verb-based boost: if detected verb's primary skill matches
    if (verbInfo && verbInfo.skill === entry.skill) {
      confidence += 0.10;
    }

    // Apply decay
    if (wordCount > 50) {
      confidence -= LONG_INTENT_PENALTY;
    }

    // Multi-group penalty
    const categories = new Set();
    for (const other of ROUTING_TABLE) {
      if (matchesKeywords(intentNorm, [...other.verbs, ...other.nouns]).length > 0) {
        categories.add(other.category);
      }
    }
    if (categories.size >= 3) {
      confidence -= MULTI_GROUP_PENALTY;
    }

    // No verb penalty — only if no verb detected across ALL skills
    if (!verbInfo && matchedVerbs.length === 0) {
      confidence -= NO_VERB_PENALTY;
    }

    // Clamp
    confidence = Math.max(0, Math.min(1, confidence));

    if (confidence > 0) {
      const allMatched = [...matchedVerbs, ...matchedNouns];
      results.push({
        skill: entry.skill,
        confidence: Math.round(confidence * 100) / 100,
        matchedKeywords: allMatched,
        secondary: entry.secondary,
        category: entry.category,
      });
    }
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);

  return results;
}

// ─── Route Decision ───────────────────────────────────────────────

function route(intent) {
  const scores = scoreIntent(intent);

  if (scores.length === 0) {
    return {
      intent,
      primary: null,
      secondary: [],
      confidence: 0,
      gap: 0,
      action: 'no-match',
      matchedKeywords: {},
      verb: null,
      hint: 'No skill matched. Orchestrator should ask user for clarification.',
    };
  }

  const top = scores[0];
  const second = scores.length > 1 ? scores[1] : null;
  const gap = second ? Math.round((top.confidence - second.confidence) * 100) / 100 : 1;

  let action;
  if (top.confidence >= CONFIDENCE_ROUTE_DIRECT && gap >= GAP_THRESHOLD) {
    action = 'route';
  } else if (top.confidence >= CONFIDENCE_ROUTE_WITH_SECONDARY) {
    action = 'route';
  } else if (top.confidence >= CONFIDENCE_UNCERTAIN) {
    action = 'route-uncertain';
  } else if (top.confidence >= CONFIDENCE_NO_MATCH) {
    action = 'disambiguate';
  } else {
    action = 'clarify';
  }

  // If gap < threshold and both scores are meaningful, suggest disambiguation
  if (gap < GAP_THRESHOLD && second && second.confidence >= CONFIDENCE_UNCERTAIN) {
    action = 'disambiguate';
  }

  const verbInfo = detectVerb(normalize(intent));

  // Build keyword map for top 3
  const matchedKeywords = {};
  for (const s of scores.slice(0, 3)) {
    matchedKeywords[s.skill] = s.matchedKeywords;
  }

  // Determine secondary skills from primary entry
  const primaryEntry = ROUTING_TABLE.find(e => e.skill === top.skill);
  let secondary = top.secondary || [];
  if (second && gap < GAP_THRESHOLD) {
    // Include second skill's secondary too
    secondary = [...new Set([...secondary, second.skill])];
  }

  return {
    intent,
    primary: top.skill,
    secondary,
    confidence: top.confidence,
    gap,
    action,
    matchedKeywords,
    verb: verbInfo ? verbInfo.verb : null,
    disambiguate: action === 'disambiguate' && second ? {
      optionA: top.skill,
      optionB: second.skill,
      question: `Bạn muốn [A] ${skillDescription(top.skill)} hay [B] ${skillDescription(second.skill)}?`,
    } : null,
    topCandidates: scores.slice(0, 3).map(s => ({
      skill: s.skill,
      confidence: s.confidence,
      matchedKeywords: s.matchedKeywords,
    })),
  };
}

// ─── Skill Description Helper ─────────────────────────────────────

function skillDescription(skillName) {
  const descriptions = {
    'fix': 'sửa lỗi ngay',
    'ck-debug': 'tìm nguyên nhân trước',
    'frontend-development': 'build component logic',
    'ui-ux-pro-max': 'thiết kế giao diện đẹp',
    'backend-development': 'xây API/service backend',
    'databases': 'xử lý database',
    'web-frameworks': 'config framework',
    'deploy': 'deploy lên server',
    'git': 'quản lý source code',
    'security-scan': 'kiểm tra bảo mật',
    'test': 'viết/chạy test',
    'code-review': 'review chất lượng code',
    'scout': 'explore codebase',
    'context-engineering': 'tìm symbol/reference',
    'diff-context': 'xem thay đổi',
    'ask': 'hỏi thêm thông tin',
    'docs': 'viết tài liệu',
    'auth': 'xử lý authentication',
    'payment-integration': 'tích hợp thanh toán',
    'web-testing': 'test trên browser',
    'ai-multimodal': 'tích hợp AI',
    'document-processing': 'xử lý document',
    'browser-automation': 'tự động browser',
    'coding-level': 'giải thích đơn giản',
    'project-organization': 'tổ chức lại project',
    'watzup': 'xem tiến độ',
    'repomix': 'tóm tắt codebase',
    'repo-map': 'map repo structure',
    'code-map': 'map code flow',
    'mcp-management': 'config MCP tools',
  };
  return descriptions[skillName] || skillName;
}

// ─── CLI Entry Point ──────────────────────────────────────────────

function main() {
  let intent;

  const args = process.argv.slice(2);

  if (args.includes('--stdin')) {
    // Read from stdin
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => {
      try {
        const data = JSON.parse(input);
        intent = data.intent || data.input || data.text || '';
      } catch {
        intent = input.trim();
      }
      outputResult(intent);
    });
    return;
  }

  if (args.includes('--json')) {
    const jsonIdx = args.indexOf('--json');
    const jsonStr = args[jsonIdx + 1];
    if (!jsonStr) {
      console.error('Error: --json requires a JSON string argument');
      process.exit(1);
    }
    try {
      const data = JSON.parse(jsonStr);
      intent = data.intent || data.input || data.text || '';
    } catch {
      console.error('Error: Invalid JSON string');
      process.exit(1);
    }
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    intent = args.join(' ');
  } else {
    console.error('Usage: node route-intent.cjs "<intent string>"');
    console.error('       echo \'{"intent":"..."}\' | node route-intent.cjs --stdin');
    console.error('       node route-intent.cjs --json \'{"intent":"..."}\'');
    process.exit(1);
  }

  outputResult(intent);
}

function outputResult(intent) {
  const result = route(intent);

  console.log(JSON.stringify(result, null, 2));

  if (result.action === 'clarify') {
    process.exit(2);
  }
}

// Export for testing
if (typeof require !== 'undefined' && require.main === module) {
  main();
}

module.exports = { route, scoreIntent, normalize, detectVerb, ROUTING_TABLE };
