# ck:auto Request Templates

Copy one template and replace the bracketed text.

## Build a small app

```text
:ck:auto build me a [type of app] for [who will use it]. It should let users [main action], [second action], and [third action]. Keep it simple and easy to use.
```

Example:

```text
:ck:auto build me a todo app for my small team. It should let users add tasks, mark tasks done, and filter by status. Keep it simple and easy to use.
```

## Make a website look better

```text
:ck:auto make this [page/app] look modern and trustworthy for [audience]. Keep the current content, improve layout, spacing, colors, and mobile view.
```

## Fix a bug

```text
:ck:auto fix the bug where [what goes wrong]. I expected [expected result], but currently [actual result]. Verify it before reporting success.
```

## Refactor safely

```text
:ck:auto refactor [area/module/file] to make it easier to maintain. Do not change user-facing behavior. Run the strongest available verification before final report.
```

## Review a project

```text
:ck:auto review this project and tell me the top problems, what is safe to fix now, and what should wait. Keep the report short and practical.
```

## Add login/signup

```text
:ck:auto thêm đăng nhập cho [app type]. Users cần [login method: email/password, Google, GitHub]. Sau khi đăng nhập, chuyển tới [page].
```

Example:

```text
:ck:auto thêm đăng nhập bằng email/password và Google cho web app. Sau khi đăng nhập chuyển tới dashboard.
```

## Add payment/checkout

```text
:ck:auto thêm thanh toán [provider: Stripe/MoMo/VNPay] cho [product/service]. Users cần [subscription/one-time payment]. Amount: [price].
```

Example:

```text
:ck:auto add Stripe checkout for monthly subscription. Price: $9.99/month. Users get access to premium features after payment.
```

## Write browser/E2E tests

```text
:ck:auto viết [Playwright/Cypress] tests cho [feature/page flow]. Test cases: [list 2-3 scenarios]. Run tests in headless mode.
```

Example:

```text
:ck:auto write Playwright tests for login and checkout flow. Test: valid login, invalid password, successful checkout.
```

## Integrate AI/Chat

```text
:ck:auto tích hợp [OpenAI/Anthropic/Gemini] cho [use case: chatbot, content generation, image generation]. Use API key from env variable.
```

Example:

```text
:ck:auto tích hợp OpenAI chat API cho customer support chatbot. Use GPT-4o model. API key from OPENAI_API_KEY env.
```

## Process documents

```text
:ck:auto xử lý [PDF/DOCX/XLSX] files — [parse/extract/generate] [what: text, tables, report]. Input: [source]. Output: [format].
```

Example:

```text
:ck:auto parse PDF invoices và extract amount, date, vendor. Output as JSON array.
```

## Scrape/automate browser

```text
:ck:auto scrape [website/page] để lấy [data type: prices, titles, links]. Lưu kết quả [format: JSON, CSV, database].
```

Example:

```text
:ck:auto scrape product names và prices từ example.com/shop. Save as CSV file.
```
