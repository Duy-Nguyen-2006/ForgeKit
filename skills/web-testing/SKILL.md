---
name: ck:web-testing
description: "E2E browser testing with Playwright or Cypress"
auto_load: false
triggers:
  - playwright
  - cypress
  - e2e
  - browser test
  - smoke test UI
  - visual regression
  - end-to-end test
non_triggers:
  - unit test
  - integration test only
  - backend test
examples:
  - "write playwright tests for login flow"
  - "thêm e2e test cho checkout"
  - "setup Cypress cho project"
metadata:
  author: forgekit
  version: "1.0.0"
---

# Web Testing

E2E & browser testing patterns với Playwright/Cypress. Bổ sung cho `test` skill, không thay thế.

## Khi nào load

- User yêu cầu Playwright/Cypress/E2E test
- Cần browser automation cho test
- Visual regression testing
- Smoke test UI flow

## Không dùng khi

- Unit test (→ test skill)
- Backend API test (→ test skill)
- Scrape/crawl website (→ browser-automation)

## Playwright Pattern (Primary)

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
- run: npx playwright install --with-deps
- run: npx playwright test
```
