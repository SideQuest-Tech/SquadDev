import { test, expect } from '@playwright/test'

test.describe('Auth / login', () => {
  test('@smoke Login button navigates to login view', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await expect(page.locator('.auth-screen')).toBeVisible()
  })

  test('login view renders email and password fields', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await expect(page.locator('.auth-form input[type="email"]')).toBeVisible()
    await expect(page.locator('.auth-form input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible()
  })

  test('Start a Project tab renders on login screen', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await expect(page.locator('.auth-tab-btn', { hasText: 'Start a Project' })).toBeVisible()
  })

  test('Start a Project tab shows correct content', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await page.locator('.auth-tab-btn', { hasText: 'Start a Project' }).click()
    await expect(page.getByText(/No account needed/i)).toBeVisible()
  })

  test('Back to site button returns to public site', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await expect(page.locator('.auth-screen')).toBeVisible()
    await page.locator('.auth-back-btn').click()
    await expect(page.locator('.auth-screen')).not.toBeVisible()
    await expect(page.locator('#home')).toBeVisible()
  })

  test('invalid login shows error message', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await page.locator('.auth-form input[type="email"]').fill('invalid@example.com')
    await page.locator('.auth-form input[type="password"]').fill('wrongpassword')
    await page.getByRole('button', { name: /Sign in/i }).click()
    await expect(page.locator('.auth-error')).toBeVisible({ timeout: 10000 })
  })

  test('login view shows Forgot password link', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await expect(page.getByRole('button', { name: /Forgot password/i })).toBeVisible()
  })

  test('Forgot password link opens the forgot form', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await page.getByRole('button', { name: /Forgot password/i }).click()
    await expect(page.locator('.auth-form input[type="email"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Send temporary password/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Back to login/i })).toBeVisible()
    await expect(page.locator('.auth-form input[type="password"]')).not.toBeVisible()
  })

  test('Back to login from forgot form restores login view', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await page.getByRole('button', { name: /Forgot password/i }).click()
    await page.getByRole('button', { name: /Back to login/i }).click()
    await expect(page.locator('.auth-form input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible()
  })

  test('forgot password email pre-fills from login form', async ({ page }) => {
    await page.goto('/')
    await page.locator('.nav-login').click()
    await page.locator('.auth-form input[type="email"]').fill('client@company.com')
    await page.getByRole('button', { name: /Forgot password/i }).click()
    await expect(page.locator('.auth-form input[type="email"]')).toHaveValue('client@company.com')
  })

  test('forgot password form submits and shows confirmation', async ({ page }) => {
    await page.route('**/api/forgot-password', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }))
    await page.goto('/')
    await page.locator('.nav-login').click()
    await page.getByRole('button', { name: /Forgot password/i }).click()
    await page.locator('.auth-form input[type="email"]').fill('client@company.com')
    await page.getByRole('button', { name: /Send temporary password/i }).click()
    await expect(page.locator('.auth-forgot-hint')).toContainText('on its way')
    await expect(page.getByRole('button', { name: /Back to login/i })).toBeVisible()
  })

  test('Back to login from confirmation restores login view', async ({ page }) => {
    await page.route('**/api/forgot-password', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }))
    await page.goto('/')
    await page.locator('.nav-login').click()
    await page.getByRole('button', { name: /Forgot password/i }).click()
    await page.locator('.auth-form input[type="email"]').fill('client@company.com')
    await page.getByRole('button', { name: /Send temporary password/i }).click()
    await page.getByRole('button', { name: /Back to login/i }).click()
    await expect(page.locator('.auth-form input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible()
  })
})
