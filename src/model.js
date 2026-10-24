/** @typedef {import('./types').City} City */
/** @typedef {import('./types').Comparison} Comparison */
/** @typedef {import('./types').Preferences} Preferences */
/** @typedef {import('./types').Dataset} Dataset */
/** @typedef {import('./types').Amount} Amount */

export const categories = ['Utilities', 'Internet', 'Phone', 'Groceries', 'Dining out', 'Transportation', 'Healthcare', 'Debt payments', 'Subscriptions', 'Entertainment'];
export const launchCities = ['New York City', 'Boston', 'Washington DC', 'Atlanta', 'Chicago', 'Austin', 'Denver', 'Seattle', 'Los Angeles', 'Philadelphia', 'Pittsburgh', 'Houston'];
/** @returns {Comparison} */
export function newComparison() {
  return { version: 1, name: 'My next chapter', baseline: { bedrooms: 1, occupants: 1, transport: 'Transit' }, cities: [] };
}
/** @param {string} name @param {Preferences} baseline @param {Dataset} data @returns {City} */
export function newCity(name, baseline, data) {
  const reference = data.cities.find(c => c.name === name);
  const city = {
    id: crypto.randomUUID(), referenceId: reference?.id || '', name, mode: /** @type {'career'} */ ('career'),
    preferences: { ...baseline }, income: null, gross: null, totalRent: null, rentShare: null,
    rentOverride: false, rentSource: null, utilitiesIncluded: false,
    expenses: categories.map((name, i) => ({ id: `default-${i}`, name, amount: null, applicable: true, period: /** @type {'monthly'} */ ('monthly'), override: false, source: null })),
    savings: null, moving: null, months: 4, funding: { work: null, grants: null, family: null, loans: null },
    tuition: null, tuitionApplicable: false, tuitionPeriod: /** @type {'funding'} */ ('funding'),
  };
  restoreRent(city, data);
  return city;
}
/** @param {City} city @param {Dataset} data */
export function restoreRent(city, data) {
  const rent = data.cities.find(c => c.id === city.referenceId)?.rents?.find(r => r.bedrooms === city.preferences.bedrooms);
  city.rentSource = rent ? structuredClone(rent) : null;
  city.totalRent = rent?.value ?? null;
  city.rentShare = rent?.value == null ? null : Math.round(rent.value / city.preferences.occupants * 100) / 100;
  city.rentOverride = false;
  city.utilitiesIncluded = rent?.value != null;
}
/** @param {City} city */
export function calculate(city) {
  let missing = city.rentShare === null ? 1 : 0;
  let expenses = city.rentShare ?? 0;
  for (const expense of city.expenses) {
    if (!expense.applicable || (expense.name === 'Utilities' && expense.id === 'default-0' && city.utilitiesIncluded)) continue;
    if (expense.amount === null) missing++;
    else expenses += expense.amount / (expense.period === 'funding' ? city.months : 1);
  }
  let tuition = 0;
  if (city.mode === 'student' && city.tuitionApplicable) {
    if (city.tuition === null) missing++;
    else tuition = city.tuition / (city.tuitionPeriod === 'funding' ? city.months : 1);
  }
  const fundingKnown = Object.values(city.funding).every(a => a !== null);
  const borrowed = (city.funding.loans ?? 0) / city.months;
  const nonBorrowed = ((city.funding.work ?? 0) + (city.funding.grants ?? 0) + (city.funding.family ?? 0)) / city.months;
  const income = city.mode === 'career' ? city.income : fundingKnown ? borrowed + nonBorrowed : null;
  const remainder = income === null ? null : income - expenses - tuition;
  return { expenses, tuition, missing, income, remainder, borrowed, nonBorrowed, complete: missing === 0 && income !== null,
    withoutLoans: city.mode === 'student' && income !== null ? nonBorrowed - expenses - tuition : null };
}
/** @param {unknown} value @returns {Comparison} */
export function validateComparison(value) {
  const bad = () => { throw new Error('Invalid comparison file. Choose a version 1 Citywise export with two or three valid city budgets. Your current work is unchanged.'); };
  /** @param {unknown} v @returns {Record<string, any>} */
  const object = v => { if (!v || typeof v !== 'object' || Array.isArray(v)) return bad(); return /** @type {Record<string, any>} */ (v); };
  /** @param {unknown} v @returns {string} */
  const string = v => typeof v === 'string' && v.length <= 500 ? v : bad();
  /** @param {unknown} v @returns {boolean} */
  const bool = v => typeof v === 'boolean' ? v : bad();
  /** @param {unknown} v @returns {Amount} */
  const amount = v => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e9) ? v : bad();
  /** @param {unknown} v @returns {Preferences} */
  const prefs = v => { const p = object(v); if (![0, 1, 2, 3, 4, 5].includes(p.bedrooms) || !Number.isInteger(p.occupants) || p.occupants < 1 || p.occupants > 10 || !['Transit', 'Car', 'Walk / bike'].includes(p.transport)) return bad(); return { bedrooms: p.bedrooms, occupants: p.occupants, transport: p.transport }; };
  /** @param {unknown} v @returns {import('./types').Reference | null} */
  const source = v => { if (v === null) return null; const s = object(v); let url; try { url = new URL(string(s.source)); } catch { return bad(); } if (url.protocol !== 'https:' || (s.bedrooms !== undefined && ![0,1,2,3,4,5].includes(s.bedrooms))) return bad(); return { ...s, value: amount(s.value ?? null), source: url.href, period: string(s.period), geography: string(s.geography), population: string(s.population ?? '') }; };
  /** @param {unknown} v @returns {string} */
  const identifier = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(v) ? v : bad();
  const input = object(value);
  if (input.version !== 1 || !Array.isArray(input.cities) || input.cities.length < 2 || input.cities.length > 3) return bad();
  /** @type {Comparison} */
  const result = { version: 1, name: string(input.name), baseline: prefs(input.baseline), cities: [] };
  const ids = new Set();
  for (const raw of input.cities) {
    const c = object(raw);
    if (ids.has(c.id) || !c.id || !['career', 'student'].includes(c.mode) || !Number.isFinite(c.months) || c.months <= 0 || c.months > 120 || !Array.isArray(c.expenses) || c.expenses.length < 10 || c.expenses.length > 60) return bad();
    ids.add(c.id);
    const funding = object(c.funding);
    const expenseIds = new Set();
    const expenses = c.expenses.map((/** @type {unknown} */ rawExpense) => {
      const e = object(rawExpense);
      if (expenseIds.has(e.id) || !['monthly', 'funding'].includes(e.period)) return bad();
      expenseIds.add(e.id);
      return { id: identifier(e.id), name: string(e.name), amount: amount(e.amount), applicable: bool(e.applicable), period: e.period, override: bool(e.override), source: source(e.source) };
    });
    if (!categories.every((name, i) => expenses.some((/** @type {import('./types').Expense} */ e) => e.id === `default-${i}` && e.name === name)) || !['monthly', 'funding'].includes(c.tuitionPeriod)) return bad();
    result.cities.push({ id: identifier(c.id), referenceId: string(c.referenceId), name: string(c.name), mode: c.mode,
      preferences: prefs(c.preferences), income: amount(c.income), gross: amount(c.gross), totalRent: amount(c.totalRent), rentShare: amount(c.rentShare), rentOverride: bool(c.rentOverride), rentSource: source(c.rentSource), utilitiesIncluded: bool(c.utilitiesIncluded), expenses,
      savings: amount(c.savings), moving: amount(c.moving), months: c.months, funding: { work: amount(funding.work), grants: amount(funding.grants), family: amount(funding.family), loans: amount(funding.loans) }, tuition: amount(c.tuition), tuitionApplicable: bool(c.tuitionApplicable), tuitionPeriod: c.tuitionPeriod });
  }
  return result;
}
/** @param {number} lat1 @param {number} lon1 @param {number} lat2 @param {number} lon2 */
export function miles(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const h = Math.sin((lat2 - lat1) * rad / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - Math.min(h, 1)));
}
