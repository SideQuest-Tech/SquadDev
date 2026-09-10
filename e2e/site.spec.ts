import { test, expect } from '@playwright/test'

test.describe('Public site', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('@smoke page title is set', async ({ page }) => {
    await expect(page).toHaveTitle(/SideQuest Tech/i)
  })

  test('navbar renders with logo and links', async ({ page }) => {
    const nav = page.locator('.navbar')
    await expect(nav).toBeVisible()
    await expect(nav.locator('.logo')).toBeVisible()
    await expect(nav.locator('#primary-navigation').getByRole('button', { name: 'Services', exact: true })).toBeVisible()
    await expect(nav.locator('#primary-navigation').getByRole('button', { name: 'Process', exact: true })).toBeVisible()
    await expect(nav.locator('#primary-navigation').getByRole('button', { name: 'Concepts', exact: true })).toBeVisible()
    await expect(nav.locator('.nav-login')).toBeVisible()
  })

  test('hero section renders with CTA', async ({ page }) => {
    const hero = page.locator('#home')
    await expect(hero).toBeVisible()
    await expect(hero.getByRole('button', { name: /Start a Project/i })).toBeVisible()
    await expect(hero.getByRole('button', { name: /View Concepts/i })).toBeVisible()
  })

  test('services section renders', async ({ page }) => {
    const section = page.locator('#services')
    await expect(section).toBeVisible()
    await expect(section.locator('.bento-svc').first()).toBeVisible()
  })

  test('process section renders with all three phases', async ({ page }) => {
    const section = page.locator('#process')
    await expect(section).toBeVisible()
    await expect(section.getByText('Discover')).toBeVisible()
    await expect(section.getByText('Build')).toBeVisible()
    await expect(section.getByText('Launch')).toBeVisible()
  })

  test('concepts section renders', async ({ page }) => {
    await expect(page.locator('#concepts')).toBeVisible()
  })

  test('footer renders with contact info', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    await expect(footer.locator('.footer-logo')).toBeVisible()
    await expect(footer.getByText(/Cape Town/i)).toBeVisible()
    await expect(footer.getByRole('link', { name: /hello@sidequesttech/i })).toBeVisible()
  })

  test('navbar Services link scrolls to services section', async ({ page }) => {
    await page.locator('#primary-navigation').getByRole('button', { name: 'Services', exact: true }).click()
    await expect(page.locator('#services')).toBeInViewport()
  })

  test('navbar Process link scrolls to process section', async ({ page }) => {
    await page.locator('#primary-navigation').getByRole('button', { name: 'Process', exact: true }).click()
    await expect(page.locator('#process')).toBeInViewport()
  })

  test('navbar Concepts link scrolls to concepts section', async ({ page }) => {
    await page.locator('#primary-navigation').getByRole('button', { name: 'Concepts', exact: true }).click()
    await expect(page.locator('#concepts')).toBeInViewport()
  })

  test('footer email link has correct href', async ({ page }) => {
    const emailLink = page.locator('footer').getByRole('link', { name: /hello@sidequesttech/i })
    await expect(emailLink).toHaveAttribute('href', 'mailto:hello@sidequesttech.co.za')
  })
})
