import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/data/reference.json', route => route.fulfill({ json: {
    version: 1, retrievedAt: '2026-10-24',
    cities: [{ id: 'nyc', name: 'New York City', state: 'NY', latitude: 40, longitude: -74, rents: [] }, { id: 'chicago', name: 'Chicago', state: 'IL', latitude: 41, longitude: -87, rents: [] }],
    institutions: [],
  } }));
});

test('individual housing share and zero expenses affect only one city; missing amounts stay provisional', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my comparison' }).click();
  const first = page.getByRole('article').nth(0);
  const second = page.getByRole('article').nth(1);
  await first.locator('summary').filter({ hasText: 'Edit budget' }).click();
  await first.getByLabel('Monthly take-home income').fill('3000');
  await first.getByLabel('Total apartment rent').fill('2400');
  await first.getByLabel('My personal rent share').fill('1200');
  await expect(first.getByTestId('expenses')).toContainText('$1,200');
  await expect(first.getByTestId('remainder')).toContainText('$1,800');
  await expect(first).toContainText('Provisional');
  await expect(second.getByTestId('remainder')).toContainText('Unknown');
  for (const category of ['Utilities', 'Internet', 'Phone', 'Groceries', 'Dining out', 'Transportation', 'Healthcare', 'Debt payments', 'Subscriptions', 'Entertainment']) {
    await first.getByLabel(category, { exact: true }).fill('0');
  }
  await expect(first.getByTestId('budget-status')).toHaveText('Complete budget');
  await first.getByLabel('One-time moving cost').fill('9000');
  await expect(first.getByTestId('expenses')).toContainText('$1,200');
  await first.getByLabel('Monthly take-home income').fill('1000');
  await expect(first.getByTestId('remainder')).toContainText('-$200');
});
