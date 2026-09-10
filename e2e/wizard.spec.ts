import { test, expect } from '@playwright/test'

test.describe('Project request wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('@smoke hero CTA opens wizard', async ({ page }) => {
    await page.locator('#home').getByRole('button', { name: /Start a Project/i }).click()
    await expect(page.locator('.wizard')).toBeVisible()
  })

  test('services section cards open wizard', async ({ page }) => {
    await page.locator('#services .bento-svc').first().click()
    await expect(page.locator('.wizard')).toBeVisible()
  })

  test('wizard shows step 1 — project type', async ({ page }) => {
    await page.locator('#home').getByRole('button', { name: /Start a Project/i }).click()
    await expect(page.getByText('What do you need help with?')).toBeVisible()
    await expect(page.locator('.option-grid')).toBeVisible()
  })

  test('wizard step indicator shows 5 steps', async ({ page }) => {
    await page.locator('#home').getByRole('button', { name: /Start a Project/i }).click()
    await expect(page.locator('.wizard-progress > div')).toHaveCount(5)
  })

  test('wizard close button dismisses modal', async ({ page }) => {
    await page.locator('#home').getByRole('button', { name: /Start a Project/i }).click()
    await expect(page.locator('.wizard')).toBeVisible()
    await page.locator('.modal-close').click()
    await expect(page.locator('.wizard')).not.toBeVisible()
  })

  test('wizard advances to step 2 after selecting project type', async ({ page }) => {
    await page.locator('#home').getByRole('button', { name: /Start a Project/i }).click()
    await page.locator('.option-grid button').first().click()
    await page.locator('.wizard-footer .btn:not(.btn-secondary)').click()
    await expect(page.getByText('Tell us a little more')).toBeVisible()
  })

  test('wizard back button returns to previous step', async ({ page }) => {
    await page.locator('#home').getByRole('button', { name: /Start a Project/i }).click()
    await page.locator('.option-grid button').first().click()
    await page.locator('.wizard-footer .btn:not(.btn-secondary)').click()
    await expect(page.getByText('Tell us a little more')).toBeVisible()
    await page.locator('.wizard-footer .btn-secondary').click()
    await expect(page.getByText('What do you need help with?')).toBeVisible()
  })
})
