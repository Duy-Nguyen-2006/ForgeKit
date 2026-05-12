---
name: ck:browser-automation
description: "Browser automation and web scraping with agent-browser, Playwright, or Puppeteer"
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
  - agent-browser
  - agent browser
  - snapshot
  - accessibility tree
non_triggers:
  - e2e test
  - unit test
  - api test
examples:
  - "scrape product data từ website"
  - "automate browser để take screenshots"
  - "crawl website và extract links"
  - "dùng agent-browser crawl data từ website"
metadata:
  author: forgekit
  version: "1.1.0"
---

# Browser Automation

Browser automation & web scraping — agent-browser, Playwright, Puppeteer. Tập trung scrape/crawl, không phải test.

## Khi nào load

- User yêu cầu scrape/crawl/headless browser
- Data extraction từ website
- Screenshot automation
- Form filling automation
- Web monitoring
- User yêu cầu agent-browser cho automation tasks

## Không dùng khi

- E2E test (→ web-testing)
- Unit/integration test (→ test)
- Chỉ cần HTTP API call (→ backend-development)

## agent-browser Pattern (Primary for ForgeCode)

agent-browser is a Rust-based headless browser automation CLI designed for AI agents. It's the **recommended primary tool** for browser automation in ForgeCode workflows because:

1. **Accessibility tree snapshots** — Returns structured accessibility tree instead of raw DOM, far better for AI parsing and data extraction
2. **CLI-native** — Natural fit for ForgeCode terminal environment, no Node.js runtime needed
3. **Ref-based interaction** — Elements get refs (@e1, @e2) for precise, reliable interaction
4. **Screenshot + eval** — Full screenshot and JavaScript evaluation support
5. **Data extraction** — Extract structured data directly from accessibility tree

### Basic Usage
```bash
# Navigate and get accessibility tree snapshot
agent-browser navigate "https://example.com"
agent-browser snapshot
# Returns: accessibility tree with refs like @e1, @e2, @e3...

# Extract data by interacting with elements
agent-browser click @e5
agent-browser type @e3 "search query"

# Screenshot
agent-browser screenshot --output page.png

# JavaScript evaluation
agent-browser eval "document.querySelectorAll('.item').length"

# Natural language browser control
agent-browser chat "Go to the products page and extract all product names"
```

### Scrape Pattern
```bash
#!/bin/bash
# scrape-products.sh
agent-browser navigate "https://shop.example.com/products"
agent-browser snapshot
# Parse accessibility tree output for structured data
agent-browser eval "JSON.stringify(Array.from(document.querySelectorAll('.product')).map(el => ({name: el.querySelector('h2')?.textContent, price: el.querySelector('.price')?.textContent})))"
```

### Crawl Pattern
```bash
#!/bin/bash
# crawl-links.sh
agent-browser navigate "https://example.com"
agent-browser eval "JSON.stringify(Array.from(document.querySelectorAll('a')).map(a => ({text: a.textContent, href: a.href})))"
# Follow links using agent-browser navigate for each URL
```

### Why agent-browser for ForgeCode
| Feature | agent-browser | Playwright | Puppeteer |
|---|---|---|---|
| Installation | Single binary | Node.js + browser | Node.js + Chrome |
| Output | Accessibility tree (AI-native) | DOM/HTML | DOM/HTML |
| CLI-native | Yes | No (library) | No (library) |
| ForgeCode fit | Perfect (terminal-based) | Needs Node script | Needs Node script |
| Ref selectors | @e1, @e2 | CSS/XPath | CSS/XPath |
| Cloud browsers | Browserless, Browserbase | Browserless | Browserless |

## Playwright Pattern

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
