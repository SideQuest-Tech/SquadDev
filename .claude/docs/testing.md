# Testing Standards

## Overview

| Type | Tool | When it runs |
|------|------|-------------|
| Unit | Vitest + React Testing Library | Every CI push |
| Integration / E2E | Playwright | Staging deploy + prod smoke |
| Performance | Lighthouse CI | Production deploy only |

Tests live in:
- `tests/` — Vitest unit tests (already present)
- `e2e/` — Playwright integration tests

---

## Unit Tests (Vitest)

Config is in `vitest.config.js`. Run with:
```bash
npm run test:unit      # run once
npm run test:watch     # watch mode
```

### What to unit test
- Pure utility functions in `src/lib/` and `src/data.ts`
- Form validation logic
- Any function with branching logic (if/else, switch)
- Storage helpers (`src/storage.ts`)

### What not to unit test
- React component render trees — test behaviour, not implementation
- API calls — those are integration tests
- Third-party libraries

### Example
```ts
// tests/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { sessionStore } from '../src/storage'

describe('sessionStore', () => {
  beforeEach(() => sessionStore.set(false))

  it('returns false when no session set', () => {
    expect(sessionStore.get()).toBe(false)
  })

  it('returns true after setting session', () => {
    sessionStore.set(true)
    expect(sessionStore.get()).toBe(true)
  })
})
```

---

## Integration / E2E Tests (Playwright)

Install (if not present):
```bash
npm init playwright@latest
```

Config:
```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
  },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
})
```

### Tagging

- Tag smoke tests `@smoke` — run on every production deploy
- Full suite runs on staging deploy only

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('login redirects to dashboard @smoke', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=email]', process.env.TEST_USER_EMAIL!)
  await page.fill('[name=password]', process.env.TEST_USER_PASSWORD!)
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/dashboard')
})

test('unauthenticated user sees login screen @smoke', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Login')
  await expect(page.locator('.auth-screen')).toBeVisible()
})

test('project wizard opens from CTA', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Start a Project')
  await expect(page.locator('.wizard')).toBeVisible()
})
```

### Rules
- Tests run against the **deployed URL**, not localhost in CI
- Never mock Redis or the database in integration tests — use a real test environment
- Use `data-testid` attributes on elements that have no reliable text label

---

## Lighthouse CI (Performance Gate)

Runs on every production deploy. Fails the pipeline if scores drop below threshold.

```js
// lighthouserc.js
module.exports = {
  ci: {
    collect: { url: [process.env.LHCI_URL] },
    assert: {
      assertions: {
        'categories:performance':   ['error', { minScore: 0.8 }],
        'categories:accessibility': ['warn',  { minScore: 0.9 }],
        'categories:best-practices':['warn',  { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
}
```

---

## Test Environment Variables

Store in `.env.test` locally (gitignored). In CI, use GitHub Secrets.

```
PLAYWRIGHT_BASE_URL=https://test.sidequesttech.co.za
TEST_USER_EMAIL=test@sidequesttech.co.za
TEST_USER_PASSWORD=...
LHCI_URL=https://sidequesttech.co.za
```
