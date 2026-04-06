# AGENTS.md — Frisol v2

> Project management platform for the 4D Framework (commercial handoff → development).

## Stack

- **Framework**: Next.js 14 (App Router, standalone output)
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **Database**: MySQL 8 via Prisma ORM 6
- **Auth**: JWT in httpOnly cookies + bcrypt
- **Testing**: Vitest (unit tests, TDD first) + Playwright E2E (integration, final validation)
- **Runtime**: Node 20, Docker multi-stage build

## Commands

### Development

```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Production build (standalone output)
npm run start            # Start production server
```

### Database

```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:push      # Push schema to DB (dev only, no migrations)
npm run prisma:seed      # Seed database (tsx prisma/seed.ts)
```

### Docker

```bash
docker compose up -d     # Start MySQL + app (app depends on healthy DB)
docker compose down      # Stop all services
```

### Unit Tests (Vitest — TDD)

```bash
npm run test                  # Run all unit tests (watch mode)
npm run test:run              # Run all unit tests once (CI mode)
npm run test:coverage         # Run with coverage report
npm run test auth             # Run tests matching 'auth' (by file name)
npm run test -- -t "login"    # Run tests matching 'login' (by test name)
```

### E2E Tests (Playwright)

```bash
npm run test:e2e              # Run all E2E tests (auto-starts dev server)
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e:headed       # Visible browser mode
npm run test:e2e:report       # Open HTML report
npx playwright test login     # Run single test file (by name pattern)
npx playwright test -g "login" # Run tests matching string in name
npx playwright test e2e/tests/login.spec.ts  # Run specific file
```

**Note**: The Playwright config auto-starts `npm run dev` via `webServer`. No need to manually start the server before tests. `reuseExistingServer: true` means if dev server is already running, it reuses it.

## Project Structure

```
src/
  app/                    # Next.js App Router
    api/                  # Route handlers (REST API)
      auth/login/         # POST /api/auth/login
      auth/logout/        # POST /api/auth/logout
      auth/me/            # GET /api/auth/me
      projects/           # GET/POST /api/projects
      projects/[id]/      # GET/PATCH/DELETE /api/projects/:id
      tribes/             # Tribe management
      users/              # User management
    dashboard/            # Dashboard page (server + client)
    login/                # Login page (client component)
    projects/[id]/        # Project wizard (multi-step)
      cliente/            # Client info step
      diagnostico/        # Diagnosis step
      causas/             # Root cause analysis
      evidencia/          # Evidence
      voz-dolor/          # Voice of pain
      impacto/            # Business impact
      dependencias/       # Dependencies
      cierre/             # Project closure
    admin/users/          # Admin user management
  lib/
    auth.ts               # JWT, bcrypt, cookie helpers
    prisma.ts             # Prisma singleton (globalThis pattern)
e2e/
  tests/                  # Playwright spec files
  fixtures/               # Test fixtures (auth.fixture.ts)
  helpers/                # Test utilities (test-utils.ts)
prisma/
  schema.prisma           # Database schema
  seed.ts                 # Seed data
```

## Code Style & Conventions

### Imports

- Use `@/*` path alias for `src/*` (configured in tsconfig.json)
- Group imports: external libraries → `@/` aliases → relative imports
- Next.js imports from `next/*` (e.g., `next/navigation`, `next/headers`)

### TypeScript

- **Strict mode enabled** — no `any` unless absolutely necessary (e.g., Prisma `where: any` for dynamic filters)
- Explicit return types on exported functions (e.g., `Promise<string>`)
- Use `interface` for object shapes, `type` for unions/intersections
- React component props: inline `{ children: React.ReactNode }` or named `interface Props`

### Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Server components | PascalCase, default export | `DashboardPage`, `HomePage` |
| Client components | PascalCase + `Client` suffix | `DashboardClient`, `ProjectLayout` |
| API route files | `route.ts` | `api/projects/route.ts` |
| Lib utilities | camelCase | `hashPassword`, `verifyToken` |
| Prisma models | PascalCase, camelCase fields | `Project`, `projectNumber` |
| CSS classes | Tailwind utilities + custom components | `.btn-primary`, `.card`, `.input-field` |
| E2E test files | `*.spec.ts` | `login.spec.ts` |
| E2E fixtures | `*.fixture.ts` | `auth.fixture.ts` |

### Component Patterns

- **Server components by default** — add `'use client'` only when needed (state, hooks, event handlers)
- Server page → fetches data, checks auth, delegates to `*Client.tsx` for interactivity
- Example: `dashboard/page.tsx` (server) → `DashboardClient.tsx` (client)
- Inline SVG icons preferred over icon libraries

### API Route Handlers

- Named exports: `GET`, `POST`, `PATCH`, `DELETE`
- Auth check at top: `const user = await getCurrentUser(); if (!user) return NextResponse.json(..., { status: 401 })`
- Return `NextResponse.json(data, { status })` with appropriate HTTP status
- Wrap in try/catch for 500 error handling
- Spanish error messages (user-facing)

### Error Handling

- Auth errors: throw `Error('No autenticado')` or `Error('Sin permisos')`
- API errors: return `{ message: string }` with HTTP status code
- Client errors: `useState('')` for error display, show in `.bg-red-50` styled div
- Token verification returns `null` on failure (not thrown)

### Styling

- **Tailwind CSS** exclusively — no CSS modules, no styled-components
- Custom component classes in `globals.css` (`@layer components`): `.btn-primary`, `.btn-secondary`, `.card`, `.input-field`, `.badge`
- Design tokens in `tailwind.config.js`: `primary`, `surface`, `on-surface`, `outline`
- Fonts: Manrope (headlines), Inter (body) — loaded via CSS `@import`
- Use semantic color names (`bg-surface`, `text-on-surface`) over raw hex values

### Database

- Prisma with MySQL — all models use UUID primary keys
- Soft deletes via `deletedAt` field on `Project`
- `@map()` for snake_case DB columns → camelCase JS fields
- `onDelete: Cascade` on child relations (Symptom, Causa, Kpi, etc.)
- Single Prisma client singleton via `globalThis` pattern (prevents hot-reload leaks)

### Auth

- JWT stored in httpOnly cookie named `jwt`
- 7-day expiration, `sameSite: 'lax'`, `secure` in production only
- Roles: `admin`, `csm`, `po`, `dev`
- `requireAuth()` throws if unauthenticated; `requireRole(...roles)` throws if wrong role

## TDD Workflow (Red-Green-Refactor)

**Every feature starts with unit tests.** The cycle is:

1. **RED** — Write a failing unit test in `src/**/*.test.ts` that describes the expected behavior
2. **GREEN** — Write the minimum code to make the test pass
3. **REFACTOR** — Clean up implementation while keeping tests green
4. **E2E LAST** — After unit tests pass, write E2E tests in `e2e/tests/*.spec.ts` for integration validation

### Rules

- **No implementation without a failing test first.** Write the test, watch it fail, then implement.
- Unit tests cover: lib utilities, business logic, auth functions, data transformations, validation
- E2E tests cover: user flows, page rendering, navigation, full-stack integration
- Start with happy-path tests, then add edge cases and error scenarios.
- Run the specific test file while developing: `npm run test auth` or `npm run test -- -t "login"`
- If a Prisma schema change is needed, update `schema.prisma` → `npm run prisma:push` → `npm run prisma:generate` before writing tests.
- Use `vi.fn()`, `vi.mock()`, `vi.spyOn()` from Vitest for mocking.
- E2E tests use fixtures from `e2e/fixtures/auth.fixture.ts` and helpers from `e2e/helpers/test-utils.ts`.

## E2E Testing Conventions

- Tests live in `e2e/tests/*.spec.ts`
- Use custom `test` from `e2e/fixtures/auth.fixture.ts` (extends Playwright)
- `TEST_USERS` constant provides test user credentials
- `loginAs(page, role)` helper for authentication
- `waitForHydration(page)` before interacting with client components
- Common selectors in `e2e/helpers/test-utils.ts`
- Tests run sequentially (`fullyParallel: false`)
- 30s timeout per test, 0 retries locally, 2 retries on CI
