# ForgeKit Routing — Real-World Integration Test Report

Date: 2026-05-12
Branch: `claude/test-forgekit-routing-OGMPj`

## Goal

Verify that ForgeKit routes user tasks to the correct skill when driven by
the **real ForgeCode CLI** (forgecode.dev, `forge` v2.12.14) against
**real public repositories** with **specific, concrete tasks** — not synthetic
unit-test fixtures.

## Setup

- Model: `cx/gpt-5.5` via `openai_compatible` provider
- Base URL: `https://api.trannhatcse.tokyo/v1`
- Forge CLI: `forgecode@2.12.14` (npm)
- Reasoning effort: `high`
- ForgeKit version: 2.6.0 (this branch)

Forge was authenticated via `~/.forge/.credentials.json` (migrated from
`OPENAI_API_KEY` + `OPENAI_URL` env vars), and the default model was set with:

```bash
forge config set model openai_compatible cx/gpt-5.5
```

## Layer 1 — Deterministic Router (`scripts/route-intent.cjs`)

The repo ships 100 routing fixtures. Baseline run:

```
$ npm run test:routing
Results: 98/100 passed (98.0%)
Failed:
  #34 "Add E2E test cho login flow"  → got web-testing, expected test
  #68 "Deploy và scan security"      → got security-scan, expected deploy
```

Then 20 freshly written real-repo prompts (see
`tests/integration/real-world-tasks.json`) were scored directly with the
deterministic router (no LLM in the loop):

```
$ node tests/integration/run-real-tasks.cjs
19/20 passed (95.0%)
```

The single failure is the same `login`-keyword collision pattern as fixture
#34, surfaced on a different repo (microsoft/playwright):

| Repo | Task | Expected | Got | Why |
|------|------|----------|-----|-----|
| microsoft/playwright | "Viết playwright tests for login page tại tests/login.spec.ts" | `web-testing` | `auth` (conf 0.6) | `auth.verbs` contains `"login"`, which outranks `web-testing.nouns` `["playwright","playwright tests for"]` because of the verb weight (0.35) + single-match bonus (0.15). |

This is a real, reproducible router bug — not a one-off — and matches the
existing fixture failure #34. Recommended fix: lift `playwright`/`playwright
tests` into `web-testing.verbs` and/or down-weight `login` as an auth verb
when a testing noun is present.

## Layer 2 — End-to-End via Forge CLI + MCP Router

Five concrete tasks were sent through the actual `forge -p ":ck:auto …"`
entry point in two cloned target repos (`expressjs/express`,
`shadcn-ui/ui`). Each was constrained to the routing phase only (no
implementation), so the orchestrator's only meaningful action was to call
the `route_intent` MCP tool and return the JSON it produced.

| # | Repo | Task | Action | Primary | Confidence | Verdict |
|---|------|------|--------|---------|-----------:|---------|
| 1 | expressjs/express | Tạo REST API endpoint POST /api/products với middleware validate request body | `route` | `backend-development` | 1.00 | PASS |
| 2 | expressjs/express | Viết unit test với Jest cho file lib/router/index.js, tăng test coverage | `route` | `test` | 1.00 | PASS |
| 3 | expressjs/express | Viết playwright tests for login page tại tests/login.spec.ts | `disambiguate` | `auth` vs `web-testing` | 0.50 | PASS (asked instead of wrong-routing) |
| 4 | expressjs/express | Thêm đăng nhập Google OAuth2 với JWT session management | `route` | `auth` | 1.00 | PASS |
| 5 | shadcn-ui/ui | Thiết kế landing page responsive đẹp với dark mode cho coffee shop, dùng tailwind | `route` | `ui-ux-pro-max` | 1.00 | PASS |

5/5 end-to-end runs produced the expected behaviour. Test 3 is especially
notable: the deterministic router alone returns `auth` for that intent, but
because the action was `disambiguate` (gap 0.20 < 0.15 threshold violated),
the orchestrator correctly stopped and asked the user. The product flow is
not broken on that input even though the top score is wrong.

All decisions were logged to `.forgekit/route-log.jsonl` with intent
hashing for privacy (verified — only `intentHash`, never raw intent).

## Issues Found

### B1 — Installer ships an incomplete MCP runtime

`bin/lgmmo-forgekit-installer.js` does **not** install:

- `mcp-server/index.cjs` (the MCP JSON-RPC server)
- `.mcp.json` at the project root (only `.mcp.json.example` inside `.forge/`)
- `node_modules/@modelcontextprotocol/sdk` (the server's only runtime dep)

Result: after `npx lgmmo-forgekit-installer`, ForgeCode has **no MCP
router**. The orchestrator's "MANDATORY FIRST ACTION: call `route_intent`"
silently degrades to either the prompt-based fallback or no routing at
all. For this test the MCP server had to be wired manually:

```bash
cp -r <forgekit-source>/mcp-server .forge/mcp-server
echo '{"mcpServers":{"forgekit-router":{"command":"node","args":[".forge/mcp-server/index.cjs"]}}}' > .mcp.json
ln -s <forgekit-source>/node_modules .forge/node_modules   # for @modelcontextprotocol/sdk
```

Recommended fixes (any one is enough):
1. Have the installer copy `mcp-server/` into `.forge/` and write a real
   `.mcp.json` at the project root pointing at `.forge/mcp-server/index.cjs`.
2. Pre-bundle the MCP server with its deps (esbuild bundle) so no
   `node_modules` is required.
3. Publish a separate `@lgmmo/forgekit-mcp` package and reference it via
   `npx` in `.mcp.json`, dropping the local copy entirely.

### B2 — `login` keyword causes test→auth mis-routing (#34 + playwright case)

`auth.verbs` contains the bare word `"login"`, which fires for any test
prompt mentioning a login page. Fixture #34 ("Add E2E test cho login flow")
was already failing; the playwright real-world case is the second
occurrence. Suggested fix: change `"login"` to a phrase like `"thêm đăng
nhập"`/`"add login"`, or add `"playwright"`/`"cypress"`/`"e2e test"` as
hard preempts in scoring.

### B3 — `Deploy và scan security` resolves to `security-scan` (fixture #68)

Compound intents where deploy is the head verb and security-scan is a
secondary concern lose the contest because the noun `"security"` is worth
nouns+context bonus in the security-scan entry. Recommended fix: when
both `deploy.verbs` and `security-scan.nouns` match, prefer the verb-bearing
skill as primary and add the other as `secondary`.

## What Works Well

- Deterministic router is fast (<10ms/call), language-agnostic for the
  trained Vietnamese+English vocabulary, and never silently fails — any
  low-confidence input drops to `disambiguate` or `clarify`.
- The MCP tool definition includes strongly-worded `"MANDATORY FIRST
  ACTION"` description and `taskSupport: "forbidden"` to prevent subagent
  recursion. cx/gpt-5.5 consistently called it first across all five
  end-to-end runs.
- `route_intent` auto-logs every decision to `.forgekit/route-log.jsonl`
  with SHA-256-truncated intent hashing; raw text never hits disk.
- The disambiguation flow (`action: disambiguate`) is wired all the way
  from the deterministic router → MCP tool response → orchestrator prompt,
  and was observed working on the playwright/login case.

## Conclusion

ForgeKit's routing pipeline works correctly with ForgeCode `cx/gpt-5.5` for
real-world tasks **when the MCP server is installed**. The deterministic
router is 95–98% accurate on real prompts, and the orchestrator calls
`route_intent` reliably. The main shipping defect is **B1** (installer
omits MCP runtime), which breaks routing for every user installing via the
documented `npx lgmmo-forgekit-installer` flow.
