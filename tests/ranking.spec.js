import { test, expect } from '@playwright/test';

test('complete comparisons sort by concrete outcomes; incomplete budgets never win', async ({ page }) => {
  await page.route('**/data/reference.json', route => route.fulfill({ json: { version: 1, retrievedAt: 'fixture', cities: [], institutions: [] } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my comparison' }).click();
  const nyc = page.getByRole('article', { name: 'New York City budget' });
  const chicago = page.getByRole('article', { name: 'Chicago budget' });
  for (const city of [nyc, chicago]) {
    await city.locator('summary').filter({ hasText: 'Edit budget' }).click();
    await city.getByLabel('Monthly take-home income').fill('3000');
    await city.getByLabel('My personal rent share').fill(city === nyc ? '1200' : '1000');
    for (const category of ['Utilities', 'Internet', 'Phone', 'Groceries', 'Dining out', 'Transportation', 'Healthcare', 'Debt payments', 'Subscriptions', 'Entertainment']) await city.getByLabel(category, { exact: true }).fill('0');
  }
  await page.getByLabel('Compare by').selectOption('expenses');
  await expect(page.getByRole('article').first()).toHaveAttribute('aria-label', 'Chicago budget');
  await chicago.getByLabel('Monthly take-home income').fill('1500');
  await page.getByLabel('Compare by').selectOption('remainder');
  await expect(page.getByRole('article').first()).toHaveAttribute('aria-label', 'New York City budget');
  await chicago.getByLabel('Monthly take-home income').fill('6000');
  await chicago.getByLabel('Monthly take-home income').press('Tab');
  await expect(page.getByRole('article').first()).toHaveAttribute('aria-label', 'Chicago budget');
  await nyc.getByLabel('Groceries', { exact: true }).fill('');
  await page.getByLabel('Compare by').selectOption('expenses');
  await expect(page.getByRole('article').first()).toHaveAttribute('aria-label', 'Chicago budget');
  await expect(nyc.getByTestId('budget-status')).toContainText('Provisional');
});

test('baseline changes update matching preferences while city departures and personal amounts survive', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my comparison' }).click();
  const nyc = page.getByRole('article').first(), chicago = page.getByRole('article').nth(1);
  await nyc.locator('summary').filter({ hasText: 'Edit budget' }).click();
  await chicago.locator('summary').filter({ hasText: 'Edit budget' }).click();
  await nyc.getByLabel('My personal rent share').fill('1200');
  await nyc.getByLabel('Getting around').selectOption('Car');
  await page.locator('#baseline > summary').click();
  await page.locator('#baseline').getByLabel('Getting around').selectOption('Walk / bike');
  await expect(nyc.getByLabel('Getting around')).toHaveValue('Car');
  await expect(chicago.getByLabel('Getting around')).toHaveValue('Walk / bike');
  await page.locator('#baseline').getByLabel('Bedrooms', { exact: true }).selectOption('2');
  await expect(nyc.getByLabel('My personal rent share')).toHaveValue('1200');
  await expect(chicago.getByLabel('Bedrooms', { exact: true })).toHaveValue('2');
});
