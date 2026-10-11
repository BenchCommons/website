import { expect, test } from '@playwright/test';
import { open } from './helpers.js';

test.use({ viewport: { width: 360, height: 800 } });

for (const hash of ['#section=intro', '', '#view=table', '#view=composite', '#section=quality', '#section=environment', '#section=rounds&compare=2026-10-06']) {
  test(`no horizontal page scroll at 360 px: ${hash || 'results'}`, async ({ page }) => {
    await open(page, hash);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
}

test('the theme toggle sets data-theme', async ({ page }) => {
  await open(page, '');
  const toggle = page.getByTestId('theme-toggle');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await toggle.click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
});
