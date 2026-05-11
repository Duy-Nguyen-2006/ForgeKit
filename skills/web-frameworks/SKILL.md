---
name: ck:web-frameworks
description: Web framework setup and configuration
auto_load: false
license: MIT
argument-hint: "[framework] [feature]"
metadata:
  author: forgekit
  version: "2.0.0"
triggers: ["next.js", "nextjs", "nuxt", "remix", "vite config", "ssr", "app router", "turborepo"]
non_triggers: ["backend API", "database", "deploy", "debug"]
examples: ["setup Next.js app router", "configure turborepo", "implement SSR page"]
---

# Web Frameworks

Next.js + Turborepo + RemixIcon skill group for modern full-stack web apps.

## When to Load

- Building full-stack web apps with Next.js
- Setting up monorepos with Turborepo
- Server-side rendering and static generation
- Build performance optimization with caching
- Consistent UI with RemixIcon (3,100+ icons)

## Stack Selection

| Use Case | Stack |
|---|---|
| Standalone app (e-commerce, SaaS, blog) | Next.js + RemixIcon |
| Multi-app monorepo (microfrontends, shared UI) | Next.js + Turborepo + RemixIcon |

## Quick Start

```bash
# Single app
npx create-next-app@latest my-app && npm install remixicon

# Monorepo
npx create-turbo@latest my-monorepo
```

## Best Practices

- **Next.js**: default to Server Components; use Client Components only when needed. Implement loading/error states. Use Image component. Set metadata for SEO.
- **Turborepo**: structure with apps/ and packages/. Define task dependencies (^build). Configure outputs for caching. Enable remote caching for teams.
- **RemixIcon**: line style for minimal, fill for emphasis. 24x24 grid. aria-labels for accessibility. currentColor for theming.

## Utility Scripts

- `scripts/nextjs-init.py` — Initialize Next.js with best practices
- `scripts/turborepo-migrate.py` — Convert existing monorepo to Turborepo

## References

- [App Router Architecture](./references/nextjs-app-router.md)
- [Server Components](./references/nextjs-server-components.md)
- [Data Fetching](./references/nextjs-data-fetching.md)
- [Optimization](./references/nextjs-optimization.md)
- [Turborepo Setup](./references/turborepo-setup.md)
- [Turborepo Pipelines](./references/turborepo-pipelines.md)
- [Turborepo Caching](./references/turborepo-caching.md)
- [RemixIcon Integration](./references/remix-icon-integration.md)

## External Docs

- Next.js: https://nextjs.org/docs/llms.txt
- Turborepo: https://turbo.build/repo/docs
- RemixIcon: https://remixicon.com
