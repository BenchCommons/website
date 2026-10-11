import { expect } from '@playwright/test';

/** Opens a hash and collects console errors and page errors. */
export async function open(page, hash) {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/' + hash);
  await expect(page.locator('main h1')).toBeVisible();
  return errors;
}
