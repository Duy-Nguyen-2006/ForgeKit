---
name: ck:frontend-development
description: Frontend component and UI logic
auto_load: false
argument-hint: "[component or feature]"
metadata:
  author: forgekit
  version: "2.0.0"
triggers: ["component", "react", "vue", "page", "hook", "client UI", "frontend"]
non_triggers: ["api", "server", "database", "deploy", "design only"]
examples: ["create a login component", "thêm page dashboard", "implement custom hook"]
---

# Frontend Development

Modern React/TypeScript frontend patterns: Suspense, lazy loading, TanStack Query/Router, MUI v7.

## When to Load

- Creating new components or pages
- Data fetching with TanStack Query
- Routing with TanStack Router
- MUI v7 styling
- Performance optimization
- Frontend TypeScript best practices

## Quick Checklist

### New Component
- `React.FC<Props>` pattern with TypeScript
- Lazy load if heavy: `React.lazy(() => import())`
- Wrap in `<SuspenseLoader>` for loading states
- `useSuspenseQuery` for data fetching
- Import aliases: `@/`, `~types`, `~components`, `~features`
- Styles: inline <100 lines, separate file >100 lines
- `useCallback` for event handlers passed to children
- `useMuiSnackbar` for notifications — never `react-toastify`

### New Feature
- Create `features/{feature-name}/` with subdirs: `api/`, `components/`, `hooks/`, `helpers/`, `types/`
- API service file: `api/{feature}Api.ts`
- Route: `routes/{feature-name}/index.tsx`
- Lazy load feature components + Suspense boundaries
- Export public API from `index.ts`

## Core Principles

1. **Lazy Load Everything Heavy** — routes, DataGrid, charts, editors
2. **Suspense for Loading** — use SuspenseLoader, not early returns (prevents CLS)
3. **useSuspenseQuery** — primary data fetching pattern
4. **Features are Organized** — api/, components/, hooks/, helpers/ subdirs
5. **Styles Based on Size** — <100 inline, >100 separate
6. **Import Aliases** — @/, ~types, ~components, ~features

## Navigation

| Need to... | Read this |
|---|---|
| Create a component | [component-patterns.md](resources/component-patterns.md) |
| Fetch data | [data-fetching.md](resources/data-fetching.md) |
| Organize files | [file-organization.md](resources/file-organization.md) |
| Style components | [styling-guide.md](resources/styling-guide.md) |
| Set up routing | [routing-guide.md](resources/routing-guide.md) |
| Handle loading/errors | [loading-and-error-states.md](resources/loading-and-error-states.md) |
| Optimize performance | [performance.md](resources/performance.md) |
| TypeScript types | [typescript-standards.md](resources/typescript-standards.md) |
| Forms/Auth/DataGrid | [common-patterns.md](resources/common-patterns.md) |
| Full examples | [complete-examples.md](resources/complete-examples.md) |

## Related Skills

- `backend-development` — API patterns that frontend consumes
- `ui-ux-pro-max` — design and layout decisions
