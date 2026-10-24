import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('production snapshot retains geography, dates, population, suppression, and source provenance', async () => {
  const data = JSON.parse(await readFile('data/reference.json', 'utf8'));
  expect(data.cities).toHaveLength(12);
  for (const city of data.cities) {
    expect(city.earnings.source).toMatch(/^https:\/\/(data|api).census.gov\//);
    expect(city.earnings.period).toContain('2024');
    expect(city.earnings.population).toContain('full time, year round');
    expect(city.rents).toHaveLength(6);
    for (const rent of city.rents) {
      expect(rent.geography).toContain('Census place');
      expect(rent.source).toContain('B25031');
      expect(rent.status).toContain('not current asking rent');
      if (rent.lowerBound !== null) expect(rent.value).toBeNull();
      if (rent.value !== null) expect(rent.value).toBeGreaterThan(0);
    }
    expect(city.wages.length).toBeGreaterThan(0);
    for (const wage of city.wages) {
      expect(wage.code).toBe('15-1252');
      expect(wage.source).toMatch(/^https:\/\/www.bls.gov\//);
      expect(wage.population).toMatch(/jobs|establishments|workplace/i);
      expect(wage.geography).toBeTruthy();
    }
  }
  expect(data.institutions.length).toBeGreaterThan(500);
  for (const institution of data.institutions) {
    expect(['two-year', 'four-year']).toContain(institution.type);
    expect(institution.latitude).toBeGreaterThan(-90);
    expect(institution.latitude).toBeLessThan(90);
    expect(institution.longitude).toBeGreaterThan(-180);
    expect(institution.longitude).toBeLessThan(180);
    expect(institution.source).toContain('nces.ed.gov');
  }
});
