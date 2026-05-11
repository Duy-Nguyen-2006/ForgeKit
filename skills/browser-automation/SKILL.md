---
name: ck:browser-automation
description: "Browser automation and web scraping"
auto_load: false
triggers:
  - scrape
  - crawl
  - headless
  - automate browser
  - screenshot
  - web scraping
  - puppeteer
  - data extraction
non_triggers:
  - e2e test
  - unit test
  - api test
examples:
  - "scrape product data từ website"
  - "automate browser để take screenshots"
  - "crawl website và extract links"
metadata:
  author: forgekit
  version: "1.0.0"
---

# Browser Automation

Browser automation & web scraping — Playwright/Puppeteer. Tập trung scrape/crawl, không phải test.

## Khi nào load

- User yêu cầu scrape/crawl/headless browser
- Data extraction từ website
- Screenshot automation
- Form filling automation
- Web monitoring

## Không dùng khi

- E2E test (→ web-testing)
- Unit/integration test (→ test)
- Chỉ cần HTTP API call (→ backend-development)

## Playwright Pattern (Primary)

### Basic Scrape
```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');

// Extract data
const data = await page.evaluate(() => {
  const items = document.querySelectorAll('.item');
  return Array.from(items).map(el => ({
    title: el.querySelector('h2')?.textContent,
    price: el.querySelector('.price')?.textContent,
  }));
});
await browser.close();
```

### Screenshot
```typescript
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

### Wait Strategies
- `await page.waitForSelector('.loaded')`
- `await page.waitForLoadState('networkidle')`
- `await page.waitForTimeout(1000)` — last resort

### Anti-Detection
- `headless: false` cho sites detect headless
- Random delays giữa requests
- Rotate user-agent
- Respect robots.txt và rate limits

## Puppeteer Pattern

```bash
npm install puppeteer
```

- Chạy trong Chrome/Chromium
- `page.evaluate()` cho DOM extraction
- `page.exposeFunction()` cho Node ↔ Browser bridge

## Ethical Guidelines

- Respect robots.txt
- Rate limit requests (1-2 req/s)
- Don't scrape personal data without consent
- Cache results to avoid re-scraping
- Check ToS before scraping

## Common Patterns

1. **Single Page Scrape**: goto → extract → close
2. **Multi-Page Crawl**: queue URLs → visit each → extract → next
3. **Login & Scrape**: authenticate → navigate → extract
4. **Scheduled Scrape**: cron job → headless → save data
5. **Monitoring**: periodically check → alert on change

## Integration

- `web-testing` — cho test flows (không phải scrape)
- `backend-development` — API endpoint cho scraped data
- `databases` — store scraped data
