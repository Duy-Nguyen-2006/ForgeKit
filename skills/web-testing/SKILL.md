---
name: ck:web-testing
description: "E2E browser testing with agent-browser, Playwright, or Cypress"
auto_load: false
triggers:
  - playwright
  - cypress
  - e2e
  - browser test
  - smoke test UI
  - visual regression
  - end-to-end test
  - agent-browser
  - agent browser
  - browser chat
non_triggers:
  - unit test
  - integration test only
  - backend test
examples:
  - "write playwright tests for login flow"
  - "thêm e2e test cho checkout"
  - "setup Cypress cho project"
  - "setup agent-browser cho E2E test"
metadata:
  author: forgekit
  version: "1.1.0"
---

# Web Testing

E2E & browser testing patterns với agent-browser, Playwright, hoặc Cypress. Bổ sung cho `test` skill, không thay thế.

## Khi nào load

- User yêu cầu Playwright/Cypress/E2E test
- User yêu cầu agent-browser cho browser testing
- Cần browser automation cho test
- Visual regression testing
- Smoke test UI flow

## Không dùng khi

- Unit test (→ test skill)
- Backend API test (→ test skill)
- Scrape/crawl website (→ browser-automation)

## agent-browser Pattern (Primary for ForgeCode)

agent-browser is a Rust-based headless browser automation CLI designed specifically for AI agents. It's the **recommended primary option for ForgeCode workflows** because:

1. **CLI-native** — ForgeCode runs in terminal; agent-browser is a CLI tool, no Node.js runtime needed for the daemon
2. **Accessibility tree with refs** — Returns accessibility tree snapshots with element references (@e1, @e2), perfect for LLM consumption and interaction
3. **No Playwright dependency** — Standalone binary, no Node.js Playwright installation required
4. **Natural language control** — `agent-browser chat` supports conversational browser interaction
5. **Cloud browser providers** — Supports Browserless, Browserbase for CI/CD environments

### Setup
```bash
# Install agent-browser CLI
npm install -g agent-browser
# hoặc
cargo install agent-browser
```

### Test Structure with agent-browser
```bash
# Snapshot-based testing (accessibility tree)
agent-browser navigate "http://localhost:3000/login"
agent-browser snapshot
# Returns accessibility tree with refs like @e1, @e2

# Interact using refs
agent-browser click @e3        # Click element by ref
agent-browser type @e5 "user@test.com"  # Type into element

# Or use natural language
agent-browser chat "Fill in the login form and submit"
```

### agent-browser + Test Script Pattern
```bash
#!/bin/bash
# e2e-login-test.sh
agent-browser navigate "http://localhost:3000/login"
agent-browser snapshot
agent-browser type @e1 "user@test.com"
agent-browser type @e2 "password123"
agent-browser click @e3
agent-browser snapshot
# Assert: check dashboard element exists in output
```

### Why agent-browser over Playwright for ForgeCode
| Feature | agent-browser | Playwright |
|---|---|---|
| Installation | Single binary | Node.js + browser download |
| Output format | Accessibility tree (AI-friendly) | DOM/HTML |
| Selector style | Ref-based (@e1) | CSS/XPath/data-testid |
| Natural language | `agent-browser chat` | Not supported |
| ForgeCode integration | CLI-native | Requires Node script |
| CI/CD | Cloud browser providers | Requires browser install |

## Playwright Pattern (Fallback for Traditional Test Suites)

### Setup
```bash
npm init playwright@latest
# hoặc
npm install @playwright/test
npx playwright install
```

### Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@test.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### Best Practices
- Dùng `data-testid` selectors, không CSS class
- Page Object Model cho flow phức tạp
- Parallel: `workers: 4` trong config
- Screenshot on failure
- Trace viewer cho debug

## Cypress Pattern

### Setup
```bash
npm install cypress --save-dev
npx cypress open
```

### Key Differences
- Runs in browser (not Node)
- `cy.intercept()` cho API mocking
- `cy.dataCy()` custom command cho data-testid

## Integration

- `test` — unit + integration tests
- `frontend-development` — UI component test
- `browser-automation` — scraping (không phải test)

## CI

```yaml
# agent-browser (no browser install needed with cloud providers)
- run: agent-browser navigate "$BASE_URL/login"
- run: agent-browser snapshot

# Playwright
- run: npx playwright install --with-deps
- run: npx playwright test
```
