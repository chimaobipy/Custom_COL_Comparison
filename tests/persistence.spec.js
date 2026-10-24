import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('save/reload and export/import retain overrides; invalid imports preserve work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my comparison' }).click();
  const city = page.getByRole('article').first();
  await city.locator('summary').filter({ hasText: 'Edit budget' }).click();
  await city.getByLabel('Monthly take-home income').fill('4200');
  await city.getByLabel('My personal rent share').fill('1200');
  await city.getByLabel('Custom category name').fill('Pet care');
  await city.getByRole('button', { name: 'Add category' }).click();
  await city.getByLabel('Pet care', { exact: true }).fill('75');
  await city.getByLabel('Getting around').selectOption('Car');
  await expect(city).toContainText('Lifestyle adjustment: transportation');
  await expect(city.getByLabel('My personal rent share')).toHaveValue('1200');
  await page.getByLabel('Comparison name').fill('A fresh start');
  await page.getByRole('button', { name: 'Save comparison' }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export comparison' }).click();
  const download = await downloadPromise;
  const file = await download.path();
  await page.reload();
  await page.getByLabel('Saved comparisons').selectOption('A fresh start');
  await page.getByRole('button', { name: 'Open saved' }).click();
  if (!await page.getByRole('article').first().getByLabel('Monthly take-home income').isVisible()) await page.getByRole('article').first().locator('summary').filter({ hasText: 'Edit budget' }).click();
  await expect(page.getByRole('article').first().getByLabel('Pet care', { exact: true })).toHaveValue('75');
  await page.getByRole('article').first().getByLabel('Monthly take-home income').fill('99');
  await page.locator('#import').setInputFiles(file);
  if (!await page.getByRole('article').first().getByLabel('Monthly take-home income').isVisible()) await page.getByRole('article').first().locator('summary').filter({ hasText: 'Edit budget' }).click();
  await expect(page.getByRole('article').first().getByLabel('Monthly take-home income')).toHaveValue('4200');
  await page.locator('#import').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"version":999}') });
  await expect(page.getByRole('alert')).toContainText('Your current work is unchanged');
  await expect(page.getByRole('article').first().getByLabel('Monthly take-home income')).toHaveValue('4200');
});

test('unavailable browser storage never claims a successful save', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my comparison' }).click();
  await page.getByRole('button', { name: 'Save comparison' }).click();
  await expect(page.getByRole('alert')).toContainText('Browser storage is unavailable or full');
  await expect(page.getByRole('article')).toHaveCount(2);
});

test('import rejects executable identifiers and reference metadata before rendering', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my comparison' }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export comparison' }).click();
  const download = await pending;
  const original = JSON.parse(await readFile(await download.path(), 'utf8'));
  for (const attack of ['city-id', 'expense-id', 'bedrooms']) {
    const imported = structuredClone(original);
    const html = '\"><img src=x onerror="document.body.dataset.compromised=1">';
    if (attack === 'city-id') imported.cities[0].id = html;
    if (attack === 'expense-id') imported.cities[0].expenses.push({ ...imported.cities[0].expenses[0], id: html, name: 'Custom expense' });
    if (attack === 'bedrooms') imported.cities[0].rentSource.bedrooms = html;
    await page.locator('#import').setInputFiles({ name: `${attack}.json`, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(imported)) });
    await expect(page.getByRole('alert')).toContainText('Your current work is unchanged');
    await expect(page.locator('body')).not.toHaveAttribute('data-compromised');
    await expect(page.locator('img')).toHaveCount(0);
    await expect(page.getByRole('article').first()).toHaveAttribute('aria-label', 'New York City budget');
  }
});
