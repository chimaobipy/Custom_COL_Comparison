import { test, expect } from '@playwright/test';

test('source-backed rent excludes utilities, keeps overrides, and shows distinct earnings populations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my comparison' }).click();
  const city = page.getByRole('article').first();
  await city.locator('summary').filter({ hasText: 'Edit budget' }).click();
  await expect(city.getByLabel('Rent share includes all utilities')).toBeChecked();
  await expect(city.getByLabel('Utilities', { exact: true })).toBeDisabled();
  await expect(city).toContainText('Not current asking rent');
  await expect(city.getByTestId('income')).toHaveText('Unknown');
  await city.getByLabel('My personal rent share').fill('1200');
  await city.getByLabel('Bedrooms', { exact: true }).selectOption('2');
  await expect(city.getByLabel('My personal rent share')).toHaveValue('1200');
  await city.getByRole('button', { name: 'Restore rent suggestion' }).click();
  await expect(city.getByLabel('My personal rent share')).toHaveValue('1811');
  await city.getByLabel('Rent share includes all utilities').uncheck();
  await city.getByLabel('Utilities', { exact: true }).fill('100');
  await expect(city.getByTestId('expenses')).toHaveText('$1,911');
  await city.getByLabel('Rent share includes all utilities').check();
  await expect(city.getByTestId('expenses')).toHaveText('$1,811');
  await city.locator('summary').filter({ hasText: 'Earnings & source notes' }).click();
  await expect(city).toContainText('City-resident earnings');
  await expect(city).toContainText('Metro occupational wages');
  await expect(city).toContainText('2023');
  await expect(city).toContainText('not Gen Z-specific');
  await expect(city).toContainText('Approx. annual median equivalent');
});

test('a third city can be added and removed without changing existing budgets', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my comparison' }).click();
  const city = page.getByRole('article').first();
  await city.locator('summary').filter({ hasText: 'Edit budget' }).click();
  await city.getByLabel('Monthly take-home income').fill('5000');
  await page.getByLabel('Add a third city').selectOption('manual');
  await page.getByLabel('City, state', { exact: true }).fill('Portland, ME');
  await page.getByRole('button', { name: 'Add city', exact: false }).click();
  await expect(page.getByRole('article')).toHaveCount(3);
  await expect(page.getByRole('article').last()).toContainText('Manual city budget');
  await expect(city.getByTestId('income')).toHaveText('$5,000');
  await page.getByRole('article').last().getByRole('button', { name: 'Remove city' }).click();
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(city.getByTestId('income')).toHaveText('$5,000');
});

test('institution radius and type filters use straight-line distances from the documented center', async ({ page }) => {
  await page.route('**/data/reference.json', route => route.fulfill({ json: { version: 1, retrievedAt: 'fixture', cities: [{ id: 'nyc', name: 'New York City', state: 'NY', latitude: 0, longitude: 0, rents: [] }], institutions: [
    { id: '1', name: 'Near University', city: 'Test', state: 'NY', latitude: 0, longitude: 0.1, type: 'four-year', website: 'https://example.edu', source: 'https://nces.ed.gov', period: '2024' },
    { id: '2', name: 'Community College', city: 'Test', state: 'NY', latitude: 0, longitude: 0.2, type: 'two-year', website: 'https://example.edu', source: 'https://nces.ed.gov', period: '2024' },
    { id: '3', name: 'Far University', city: 'Test', state: 'NY', latitude: 0, longitude: 0.5, type: 'four-year', website: 'https://example.edu', source: 'https://nces.ed.gov', period: '2024' },
  ] } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my comparison' }).click();
  const city = page.getByRole('article').first();
  await city.locator('summary').filter({ hasText: 'Explore nearby colleges' }).click();
  await expect(city.getByLabel('Discovery radius (miles)')).toHaveValue('25');
  await expect(city).toContainText('2 eligible institutions within 25 miles');
  await expect(city).toContainText('6.9 straight-line miles');
  await expect(city.getByRole('link', { name: 'Far University' })).toHaveCount(0);
  await city.getByLabel('Institution type').selectOption('four-year');
  await expect(city).toContainText('1 eligible institution within 25 miles');
  await city.getByLabel('Discovery radius (miles)').fill('50');
  await city.getByLabel('Discovery radius (miles)').press('Tab');
  await expect(city).toContainText('2 eligible institutions within 50 miles');
  await expect(city).toContainText('34.5 straight-line miles');
});

test('setup and editing are keyboard usable at mobile and desktop widths', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Build my comparison' }).focus();
    await page.keyboard.press('Enter');
    const city = page.getByRole('article').first();
    await city.locator('summary').filter({ hasText: 'Edit budget' }).focus();
    await page.keyboard.press('Enter');
    await expect(city.getByLabel('Monthly take-home income')).toBeVisible();
    await city.getByLabel('Monthly take-home income').fill('3000');
    await expect(city.getByTestId('income')).toHaveText('$3,000');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  }
});
