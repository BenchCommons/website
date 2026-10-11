import { readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { open } from './helpers.js';

const rounds = readdirSync('data/benchmark-tool/docs/results', { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(d.name)).length;

test('results chart shows bars for the latest round', async ({ page }) => {
  const errors = await open(page, '');
  await expect(page.locator('main h1')).toContainText('Results, round');
  expect(await page.locator('.chart li').count()).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

for (const [hash, selector] of [
  ['#view=composite', 'main table tbody tr'],
  ['#section=quality', 'main table tbody tr'],
  ['#section=environment', 'main table tbody tr'],
  ['#section=intro', 'main h2'],
]) {
  test(`${hash} renders without console errors`, async ({ page }) => {
    const errors = await open(page, hash);
    expect(await page.locator(selector).count()).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}

test('previous rounds lists every dated directory in BT', async ({ page }) => {
  const errors = await open(page, '#section=rounds');
  await expect(page.getByTestId('round-list').locator('li')).toHaveCount(rounds);
  expect(errors).toEqual([]);
});

test('comparing two rounds shows a ratio table', async ({ page }) => {
  await open(page, '#section=rounds&round=2026-10-11&compare=2026-10-06');
  await expect(page.locator('main table tbody tr').first()).toContainText('×');
});

test('a cell where nearly every generator failed still lists the failures', async ({ page }) => {
  await open(page, '#round=2026-10-11&suite=GG&cell=nf100000-cs50');
  await expect(page.locator('.failed')).toContainText('Did not complete');
});

test('the comparison keeps its table and tab focus when the suite changes', async ({ page }) => {
  await open(page, '#section=rounds&round=2026-10-11&compare=2026-10-06');
  const p = page.getByRole('tab', { name: /^P 50/ });
  await p.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /^M 1,000/ })).toBeFocused();
  await expect(page.locator('main table tbody tr').first()).toContainText('×');
});
