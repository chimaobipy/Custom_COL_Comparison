import { newComparison, newCity, launchCities, calculate, restoreRent, validateComparison, miles } from './model.js';

/** @typedef {import('./types').City} City */
/** @typedef {import('./types').Preferences} Preferences */
/** @type {import('./types').Dataset} */
let data = { version: 1, retrievedAt: '', cities: [], institutions: [] };
let state = newComparison();
let dashboard = false;
let sort = 'original';
/** @type {Record<string, {radius:number,type:string}>} */
const discovery = {};
const expanded = new Set();
const main = /** @type {HTMLElement} */ (document.querySelector('main'));
const money = (/** @type {number | null} */ value) => value === null ? 'Unknown' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const escape = (/** @type {unknown} */ value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c);
const option = (/** @type {string | number} */ value, /** @type {string | number} */ current, /** @type {string} */ label = String(value)) => `<option value="${escape(value)}" ${value === current ? 'selected' : ''}>${escape(label)}</option>`;
const numberInput = (/** @type {string} */ label, /** @type {string} */ field, /** @type {number|null} */ value, extra = '') => `<label>${escape(label)}<span class="money-input"><span aria-hidden="true">$</span><input aria-label="${escape(label)}" type="number" min="0" max="1000000000" step="any" placeholder="Unknown" data-field="${field}" value="${value ?? ''}" ${extra}></span></label>`;
const select = (/** @type {string} */ label, /** @type {string} */ field, /** @type {string} */ options) => `<label>${label}<select aria-label="${escape(label)}" data-field="${field}">${options}</select></label>`;

/** @param {string} message @param {boolean} error */
function notice(message, error = false) {
  const el = /** @type {HTMLElement} */ (document.getElementById('notice'));
  el.textContent = message;
  el.className = error ? 'notice error' : 'notice';
  el.setAttribute('role', error ? 'alert' : 'status');
}

/** @param {Preferences} p @param {string} prefix */
function preferences(p, prefix) {
  return `${select('Bedrooms', `${prefix}.bedrooms`, [0, 1, 2, 3, 4, 5].map(n => option(n, p.bedrooms, n === 0 ? 'Studio' : `${n}${n === 5 ? '+' : ''} bedroom${n > 1 ? 's' : ''}`)).join(''))}
    <label>People sharing rent<input type="number" min="1" max="10" step="1" required data-field="${prefix}.occupants" value="${p.occupants}"></label>
    ${select('Getting around', `${prefix}.transport`, ['Transit', 'Car', 'Walk / bike'].map(v => option(v, p.transport)).join(''))}`;
}

function setup() {
  main.innerHTML = `<section class="intro"><div class="eyebrow"><span></span> YOUR LIFE, IN A NEW PLACE</div><h1>New city.<br>Same you. <em>New possibilities.</em></h1><p>Find a place that fits your life and your budget.<br>Compare what comes in, what goes out, and what’s left for you.</p></section>
    <section class="setup-panel"><div class="step-label">01 / SET YOUR DIRECTION</div><h2>Where could life take you?</h2><p class="muted">Choose two or three cities. You can adjust every amount along the way.</p>
    <form id="setup"><div class="setup-cities">${[0, 1, 2].map((n) => `<label>${n === 0 ? 'Start here' : n === 1 ? 'Compare with' : 'One more? (optional)'}<select name="city-${n}">${n === 2 ? '<option value="">Keep it to two</option>' : ''}${launchCities.map(c => option(c, n === 0 ? 'New York City' : n === 1 ? 'Chicago' : '')).join('')}<option value="manual">Another US city…</option></select><input name="manual-${n}" aria-label="Custom city ${n + 1}" placeholder="City, state" maxlength="100" hidden></label>`).join('<span class="city-link" aria-hidden="true">↗</span>')}</div>
    <div class="baseline-intro"><span class="step-label">02 / YOUR STARTING POINT</span><h3>A few things that feel like you.</h3><p class="muted">Shared preferences give your cities a common starting point.</p></div><div class="form-grid baseline-fields">${preferences(state.baseline, 'baseline')}</div>
    <div class="setup-bottom"><span>◈ Your numbers stay in your browser.</span><button class="primary" type="submit">Build my comparison <span aria-hidden="true">↗</span></button></div></form></section>
    <section class="setup-notes"><div><span class="note-number">01</span><h3>Your share. Your choices.</h3><p>Roommates, transit, a little more dining out. Build a budget for one individual.</p></div><div><span class="note-number">02</span><h3>A clear view of the unknown.</h3><p>Missing costs stay visible. Historical references always come with their context.</p></div><div><span class="note-number">03</span><h3>Room for your next chapter.</h3><p>Explore work or student funding, then save a comparison to come back to.</p></div></section>${savedTools()}`;
}

function savedTools() {
  /** @type {string[]} */
  let saved = [];
  try { saved = Object.keys(readLibrary()); } catch { /* feedback on save/load */ }
  return `<div class="library"><label>Saved comparisons<select id="saved"><option value="">Choose a saved comparison</option>${saved.map(name => `<option>${escape(name)}</option>`).join('')}</select></label><button type="button" data-action="load">Open saved</button><label class="file-button">Import comparison<input type="file" id="import" accept="application/json,.json"></label></div>`;
}

/** @param {City} city */
function stats(city) {
  const c = calculate(city);
  return `<span class="status ${c.complete ? 'complete' : ''}" data-testid="budget-status">${c.complete ? 'Complete budget' : `Provisional · ${c.missing ? `${c.missing} missing expense${c.missing === 1 ? '' : 's'}` : 'income unknown'}`}</span>
    <div class="stat-row"><span>${city.mode === 'student' ? 'Monthly student funding' : 'Monthly take-home'}</span><strong data-testid="income">${money(c.income)}</strong></div>
    <div class="stat-row"><span>Living expenses${c.missing ? ' · known so far' : ''}</span><strong data-testid="expenses">${money(c.expenses)}</strong></div>
    ${city.mode === 'student' && city.tuitionApplicable ? `<div class="stat-row"><span>Tuition · separate / month</span><strong>${city.tuition === null ? 'Unknown' : money(c.tuition)}</strong></div>` : ''}
    <div class="remainder ${c.remainder !== null && c.remainder < 0 ? 'negative' : ''}"><span>MONTHLY REMAINDER${c.complete ? '' : ' · PROVISIONAL'}</span><strong data-testid="remainder">${money(c.remainder)}</strong><small>${c.remainder === null ? 'Add your income to see what’s left.' : c.remainder < 0 ? 'A funding shortfall to plan for.' : 'After living expenses' + (city.mode === 'student' && city.tuitionApplicable ? ' and tuition' : '')}</small></div>
    <div class="goal"><span>Savings-goal coverage</span><strong>${city.savings === null ? 'Set a goal' : c.remainder === null ? 'Unknown' : city.savings === 0 ? 'No savings goal' : `${Math.round(Math.max(0, c.remainder) / city.savings * 100)}%${c.complete ? '' : ' · provisional'}`}</strong><div class="goal-track"><span style="width:${city.savings && c.remainder !== null ? Math.min(100, Math.max(0, c.remainder) / city.savings * 100) : 0}%"></span></div><small>${city.savings !== null && c.remainder !== null ? `${money(Math.max(0, city.savings - c.remainder))} to goal${c.complete ? '' : ' before unknown costs'}` : 'Planned saving stays separate from expenses.'}</small></div>
    ${city.mode === 'student' ? `<div class="student-summary"><p>Non-borrowed funding <strong>${money(c.nonBorrowed)}/mo${c.income === null ? ' known so far' : ''}</strong></p><p>Loan proceeds <strong>${city.funding.loans === null ? 'Unknown' : money(c.borrowed) + '/mo'}</strong></p><p>Remainder without borrowing <strong>${money(c.withoutLoans)}${c.complete ? '' : ' · provisional'}</strong></p><small>${c.borrowed > 0 ? 'Available cash includes borrowing, not earnings. ' : ''}${c.withoutLoans !== null && city.savings !== null && c.withoutLoans < city.savings && c.remainder !== null && c.remainder >= city.savings ? 'Meeting this savings goal relies on borrowing. ' : ''}Funding and tuition use your chosen period.</small></div>` : ''}`;
}

/** @param {City} city */
function cityEditor(city) {
  return `<details class="editor" data-section="${city.id}:budget" ${expanded.has(`${city.id}:budget`) ? 'open' : ''}><summary>Edit budget <span aria-hidden="true">+</span></summary><div class="editor-body">
    ${select('Budget scenario', 'mode', option('career', city.mode, 'Early career') + option('student', city.mode, 'Student'))}
    <div class="section-heading">${city.mode === 'student' ? 'Student funding' : 'Your income'}</div>
    ${city.mode === 'career' ? `${numberInput('Monthly take-home income', 'income', city.income)}${numberInput('Gross annual salary (context only)', 'gross', city.gross)}<p class="hint">Enter income after tax. Gross salary and benchmarks never populate your take-home income.</p>` : `<label>Funding period (months)<input type="number" min="0.01" max="120" step="any" required data-field="months" value="${city.months}"></label><p class="hint">Enter total funding for this period. A $6,000 grant over 4 months is $1,500 per month. Enter 0 when a funding type does not apply.</p>${numberInput('Work income over funding period', 'funding.work', city.funding.work)}${numberInput('Grants over funding period', 'funding.grants', city.funding.grants)}${numberInput('Family support over funding period', 'funding.family', city.funding.family)}${numberInput('Loan proceeds over funding period', 'funding.loans', city.funding.loans)}<label class="check"><input type="checkbox" data-field="tuitionApplicable" ${city.tuitionApplicable ? 'checked' : ''}> Include tuition separately</label>${city.tuitionApplicable ? `${numberInput('Tuition amount', 'tuition', city.tuition)}${select('Tuition amount covers', 'tuitionPeriod', option('funding', city.tuitionPeriod, 'Funding period') + option('monthly', city.tuitionPeriod, 'One month'))}` : ''}`}
    <div class="section-heading">Your housing</div><div class="form-grid">${preferences(city.preferences, 'preferences')}</div><div class="preference-note">${departure(city)}</div>
    ${numberInput('Total apartment rent', 'totalRent', city.totalRent)}${numberInput('My personal rent share', 'rentShare', city.rentShare)}<p class="hint">Only your personal share enters your budget. Your split may be unequal.</p><label class="check"><input type="checkbox" data-field="utilitiesIncluded" ${city.utilitiesIncluded ? 'checked' : ''}> Rent share includes all utilities</label><p class="hint">Included utilities are excluded from the separate Utilities line. If your rent includes only some utilities, uncheck this and enter only your additional utility cost.</p><p class="rent-origin">${rentContext(city)}</p><button type="button" class="text-button" data-action="restore">Restore rent suggestion</button>
    <div class="section-heading">The rest of life <span>MONTHLY BY DEFAULT</span></div><p class="hint">Blank = unknown. Enter 0 for a real zero, or mark a category not applicable. Unverified estimates are left blank.</p>
    ${city.expenses.map(e => `<div class="expense" data-expense="${e.id}">${numberInput(e.name, `expense.${e.id}.amount`, e.amount, !e.applicable || (e.id === 'default-0' && city.utilitiesIncluded) ? 'disabled' : '')}<label class="check"><input type="checkbox" data-field="expense.${e.id}.applicable" ${e.applicable ? 'checked' : ''}> Applies${e.id === 'default-0' && city.utilitiesIncluded ? ' · included in rent; excluded here' : ''}</label>${city.mode === 'student' ? select(`${escape(e.name)} amount covers`, `expense.${e.id}.period`, option('monthly', e.period, 'One month') + option('funding', e.period, 'Funding period')) : ''}<small class="hint">${e.override ? 'Personal amount' : e.source ? `Source estimate · ${escape(e.source.geography)} · ${escape(e.source.period)}` : 'Manual entry · no validated estimate'}</small>${e.source ? `<a href="${safeURL(e.source.source)}" target="_blank" rel="noopener noreferrer">Source</a>` : ''}</div>`).join('')}
    <div class="custom-category"><label>Custom category name<input type="text" data-custom maxlength="80" placeholder="e.g. Pet care"></label><button type="button" data-action="custom">Add category</button></div>
    <div class="section-heading">A little room for the future</div>${numberInput('Monthly savings goal', 'savings', city.savings)}${numberInput('One-time moving cost', 'moving', city.moving)}<p class="hint">Moving costs are kept outside your recurring monthly expenses.</p></div></details>`;
}

/** @param {City} city */
function departure(city) {
  const differences = [];
  if (city.preferences.bedrooms !== state.baseline.bedrooms) differences.push('bedrooms');
  if (city.preferences.occupants !== state.baseline.occupants) differences.push('people sharing');
  if (city.preferences.transport !== state.baseline.transport) differences.push('transportation');
  return differences.length ? `Lifestyle adjustment: ${differences.join(', ')} differ from the comparison baseline.` : 'Matches comparison baseline.';
}

/** @param {unknown} url */
function safeURL(url) {
  try { const u = new URL(String(url)); return ['https:', 'http:'].includes(u.protocol) ? escape(u.href) : '#'; } catch { return '#'; }
}
/** @param {City} city */
function rentContext(city) {
  const r = city.rentSource;
  return `${city.rentOverride ? 'Personal amount · ' : ''}${r && r.value !== null ? `Historical median gross rent for occupied cash-rent units, ${r.bedrooms === 0 ? 'studio' : `${r.bedrooms ?? city.preferences.bedrooms}${r.bedrooms === 5 ? '+' : ''} bedrooms`}: ${money(r.value ?? null)}. ${escape(r.geography)} · ${escape(r.period)}. Gross rent includes contract rent and applicable electricity, gas, water/sewer, and fuels. Not current asking rent. <a href="${safeURL(r.source)}" target="_blank" rel="noopener noreferrer">Census source ↗</a>` : 'No validated bedroom rent estimate available. Enter your own total and personal share.'}`;
}

/** @param {City} city */
function references(city) {
  const ref = data.cities.find(c => c.id === city.referenceId);
  const e = ref?.earnings;
  const wages = ref?.wages ?? [];
  return `<details data-section="${city.id}:references" ${expanded.has(`${city.id}:references`) ? 'open' : ''}><summary>Earnings & source notes <span aria-hidden="true">+</span></summary><div class="editor-body reference-notes"><h4>City-resident earnings</h4><p>Median <strong>${money(e?.median ?? null)}</strong> · Mean <strong>${money(e?.mean ?? null)}</strong> per year</p><p>${escape(e?.population || 'City residents aged 16+ who worked full time, year round and had earnings. Broader ages than Gen Z.')}</p><p>${e ? `${escape(e.geography)} · ${escape(e.period)} · <a href="${safeURL(e.source)}" target="_blank" rel="noopener noreferrer">Census ACS ${e.source.includes('S2001') ? 'S2001' : 'B20018'} ↗</a>` : 'No validated city earnings release available for this location.'}</p>${e?.status ? `<p>${escape(e.status)}</p>` : ''}<h4>Metro occupational wages</h4>${wages.length ? wages.map(w => `<p><strong>${escape(w.occupation)} (${escape(w.code)})</strong><br>Approx. annual median equivalent ${money(w.median)} · Annual mean ${money(w.mean)}<br>${escape(w.geography)} · ${escape(w.period)}<br>${escape(w.population)}<br>${escape(w.status)}<br><a href="${safeURL(w.source)}" target="_blank" rel="noopener noreferrer">BLS OEWS source ↗</a></p>`).join('') : '<p>No validated occupation wage snapshot available. <a href="https://www.bls.gov/oes/tables.htm" target="_blank" rel="noopener noreferrer">Explore BLS OEWS ↗</a></p>'}<p>Workplace-based metro wages describe covered jobs, a different population from city residents. Neither benchmark is personal take-home income.</p><p>All other expense categories use personal amounts until a defensible source is available. Blank amounts remain unknown.</p></div></details>`;
}

/** @param {City} city */
function institutions(city) {
  const ref = data.cities.find(c => c.id === city.referenceId);
  const setting = discovery[city.id] ||= { radius: 25, type: 'all' };
  const matches = ref ? data.institutions.map(i => ({ ...i, distance: miles(ref.latitude, ref.longitude, i.latitude, i.longitude) })).filter(i => i.distance <= setting.radius && (setting.type === 'all' || i.type === setting.type)).sort((a, b) => a.distance - b.distance) : [];
  return `<details data-section="${city.id}:colleges" ${expanded.has(`${city.id}:colleges`) ? 'open' : ''}><summary>Explore nearby colleges <span aria-hidden="true">+</span></summary><div class="editor-body"><p class="hint">Straight-line miles from the documented city center, not commute time. Main-campus locations do not imply coverage of satellite campuses.</p>${ref ? `<div class="form-grid"><label>Discovery radius (miles)<input type="number" min="1" max="100" step="1" required data-discovery="radius" value="${setting.radius}"></label><label>Institution type<select data-discovery="type">${option('all', setting.type, 'All eligible colleges')}${option('two-year', setting.type, 'Two-year')}${option('four-year', setting.type, 'Four-year')}</select></label></div><p>${matches.length} eligible institution${matches.length === 1 ? '' : 's'} within ${setting.radius} miles</p><ul class="institutions">${matches.map(i => `<li><a href="${safeURL(i.website)}" target="_blank" rel="noopener noreferrer">${escape(i.name)} ↗</a><span>${escape(i.city)}, ${escape(i.state)} · ${i.type} · ${i.distance.toFixed(1)} straight-line miles</span><small><a href="${safeURL(i.source)}" target="_blank" rel="noopener noreferrer">NCES IPEDS · ${escape(i.period)}</a></small></li>`).join('')}</ul><p class="hint">City-center origin (Census Gazetteer place internal point): ${ref.latitude.toFixed(4)}, ${ref.longitude.toFixed(4)}. Directory coverage is limited to the validated snapshot, not every branch or training provider.</p>` : '<p>College discovery needs a validated city-center coordinate. Manual city budgets have no location assumptions.</p>'}</div></details>`;
}

function render() {
  for (const section of main.querySelectorAll('details[data-section]')) {
    const detail = /** @type {HTMLDetailsElement} */ (section);
    const key = /** @type {string} */ (detail.dataset.section);
    detail.open ? expanded.add(key) : expanded.delete(key);
  }
  if (!dashboard) return setup();
  const cities = [...state.cities];
  if (sort !== 'original') cities.sort((a, b) => {
    const ca = calculate(a), cb = calculate(b);
    if (ca.complete !== cb.complete) return ca.complete ? -1 : 1;
    if (!ca.complete) return 0;
    return sort === 'expenses' ? ca.expenses - cb.expenses : (cb.remainder ?? 0) - (ca.remainder ?? 0);
  });
  main.innerHTML = `<section class="dashboard-heading"><div><div class="eyebrow"><span></span> A CLEARER PICTURE OF WHAT’S NEXT</div><h1>Find your <em>room to live.</em></h1><p>Your income. Your lifestyle. A side-by-side look at the possibilities.</p></div><div class="comparison-name"><label>Comparison name<input id="comparison-name" maxlength="100" value="${escape(state.name)}"></label><button class="primary" data-action="save">Save comparison <span aria-hidden="true">↗</span></button></div></section>
    <section class="comparison-toolbar"><div><span class="step-label">THE COMPARISON BASELINE</span><details id="baseline"><summary>${state.baseline.bedrooms === 0 ? 'Studio' : `${state.baseline.bedrooms} bedroom${state.baseline.bedrooms > 1 ? 's' : ''}`} · ${state.baseline.occupants === 1 ? 'Living solo' : `${state.baseline.occupants} sharing`} · ${state.baseline.transport} <span> Edit</span></summary><div class="baseline-popover"><p>Changes apply to cities that still match each previous baseline preference. Personal amounts stay intact; restore suggestions explicitly.</p><div class="form-grid">${preferences(state.baseline, 'baseline')}</div></div></details></div><label class="sort">Compare by<select id="sort">${option('original', sort, 'Your city order')}${option('expenses', sort, 'Lowest living expenses')}${option('remainder', sort, 'Highest monthly remainder')}</select></label></section>
    <p class="comparison-help">All amounts in USD per month. Complete budgets sort first; provisional budgets retain their order and are excluded from rankings.</p><section class="comparison-grid ${cities.length === 3 ? 'three' : ''}">${cities.map((city, index) => `<article aria-label="${escape(city.name)} budget" data-city="${city.id}" class="city-card"><div class="city-title"><div><span class="city-index">${String(index + 1).padStart(2, '0')} / A PLACE TO CALL HOME</span><h2>${escape(city.name)}</h2><p>${data.cities.some(c => c.id === city.referenceId && c.rents?.some(r => r.value !== null)) ? 'Source-backed housing · editable personal budget' : 'Manual city budget · estimates unavailable'}</p></div>${state.cities.length > 2 ? '<button class="remove" data-action="remove" aria-label="Remove city">×</button>' : ''}</div><div class="metrics">${stats(city)}</div>${cityEditor(city)}${references(city)}${institutions(city)}</article>`).join('')}</section>
    <section class="comparison-bottom">${state.cities.length < 3 ? `<form id="add-city"><label>Add a third city<select name="city">${launchCities.filter(n => !state.cities.some(c => c.name === n)).map(n => `<option>${n}</option>`).join('')}<option value="manual">Another US city…</option></select></label><label class="manual-add" hidden>City, state<input name="manual" maxlength="100"></label><button type="submit">Add city <span aria-hidden="true">+</span></button></form>` : '<p class="muted">Three cities. Plenty of possibilities.</p>'}<div class="export-box"><button data-action="export">Export comparison ↓</button><p>Exports include your financial details.<br>Keep the file somewhere private.</p></div></section>${savedTools()}<section class="data-note"><span>◈</span><div><h3>Clarity starts with honest numbers.</h3><p>Unknown isn’t zero. A provisional remainder excludes missing expenses and can overstate what you have left. Historical rent and earnings are reference points; your personal amounts decide your budget. ${data.retrievedAt ? `Reference snapshot retrieved ${escape(data.retrievedAt)}.` : 'Reference data unavailable; manual budgets still work.'}</p></div></section>`;
}

function updateMetrics() {
  for (const city of state.cities) {
    const article = main.querySelector(`[data-city="${city.id}"]`);
    const metrics = article?.querySelector('.metrics');
    if (metrics) metrics.innerHTML = stats(city);
    const origin = article?.querySelector('.rent-origin');
    if (origin) origin.innerHTML = rentContext(city);
    const preferenceNote = article?.querySelector('.preference-note');
    if (preferenceNote) preferenceNote.textContent = departure(city);
    for (const field of ['totalRent', 'rentShare']) {
      const input = /** @type {HTMLInputElement | null} */ (article?.querySelector(`[data-field="${field}"]`));
      if (input && input !== document.activeElement) input.value = String(/** @type {any} */ (city)[field] ?? '');
    }
  }
}

/** @returns {Record<string, unknown>} */
function readLibrary() {
  const raw = localStorage.getItem('citywise.comparisons.v1');
  if (!raw) return {};
  const v = JSON.parse(raw);
  if (v === null || typeof v !== 'object' || Array.isArray(v)) throw new Error('Saved comparisons are unreadable. Export your current comparison for backup.');
  return v;
}

main.addEventListener('toggle', event => {
  const target = /** @type {HTMLDetailsElement} */ (event.target);
  const key = target.dataset.section;
  if (key && target.isConnected) target.open ? expanded.add(key) : expanded.delete(key);
}, true);

main.addEventListener('input', event => {
  const target = /** @type {HTMLInputElement | HTMLSelectElement} */ (event.target);
  if (target.id === 'comparison-name') state.name = target.value;
  if (target.type === 'number') {
    const value = target.value === '' ? null : Number(target.value);
    target.setCustomValidity(value !== null && (!Number.isFinite(value) || value < Number(target.min || 0) || value > Number(target.max || 1e9) || (target.step === '1' && !Number.isInteger(value))) ? `Enter a number from ${target.min || 0} to ${target.max || 1e9}${target.step === '1' ? ' in whole numbers' : ''}.` : '');
    const errorId = 'field-error';
    const existing = target.parentElement?.querySelector('.field-error');
    existing?.remove();
    target.setAttribute('aria-invalid', String(!target.validity.valid));
    if (!target.validity.valid) {
      const error = document.createElement('span'); error.className = 'field-error'; error.id = errorId; error.textContent = target.validationMessage; target.parentElement?.append(error); target.setAttribute('aria-describedby', errorId); return;
    }
    target.removeAttribute('aria-describedby');
  }
  if (!target.dataset.field || target.type === 'checkbox' || target.tagName === 'SELECT') return;
  changeField(target, false);
});

/** @param {HTMLInputElement | HTMLSelectElement} target @param {boolean} redraw */
function changeField(target, redraw) {
  if (!target.checkValidity()) { target.reportValidity(); return; }
  const field = target.dataset.field || '';
  const article = target.closest('[data-city]');
  const city = state.cities.find(c => c.id === /** @type {HTMLElement | null} */ (article)?.dataset.city);
  const value = target.type === 'checkbox' ? /** @type {HTMLInputElement} */ (target).checked : target.type === 'number' ? target.value === '' ? null : Number(target.value) : target.value;
  if (field.startsWith('baseline.')) {
    const key = /** @type {keyof Preferences} */ (field.split('.')[1]);
    if (value === null) return;
    const previous = state.baseline[key];
    /** @type {any} */ (state.baseline)[key] = key === 'transport' ? value : Number(value);
    for (const c of state.cities) if (c.preferences[key] === previous) { /** @type {any} */ (c.preferences)[key] = state.baseline[key]; if (!c.rentOverride && key !== 'transport') restoreRent(c, data); }
  } else if (city) {
    const [root, key, prop] = field.split('.');
    if (root === 'preferences') {
      if (value === null) return;
      /** @type {any} */ (city.preferences)[key] = key === 'transport' ? value : Number(value);
      if (!city.rentOverride && key !== 'transport') restoreRent(city, data);
    } else if (root === 'expense') {
      const expense = city.expenses.find(e => e.id === key);
      if (expense) { /** @type {any} */ (expense)[prop] = value; if (prop === 'amount') expense.override = true; }
      const hint = target.closest('.expense')?.querySelector('small');
      if (hint && prop === 'amount') hint.textContent = 'Personal amount';
    } else if (root === 'funding') /** @type {any} */ (city.funding)[key] = value;
    else {
      if (root === 'months' && value === null) return;
      /** @type {any} */ (city)[root] = value;
      if (['totalRent', 'rentShare'].includes(root)) city.rentOverride = true;
    }
  }
  if (redraw && dashboard) render(); else updateMetrics();
}

main.addEventListener('change', async event => {
  const target = /** @type {HTMLInputElement | HTMLSelectElement} */ (event.target);
  if (target.name.startsWith('city-') || (target.name === 'city' && target.closest('#add-city'))) {
    const manual = target.closest('label')?.querySelector('input') || target.closest('form')?.querySelector('.manual-add');
    if (manual) /** @type {HTMLElement} */ (manual).hidden = target.value !== 'manual';
  }
  if (target.dataset.field) {
    const baselineWasOpen = /** @type {HTMLDetailsElement | null} */ (document.getElementById('baseline'))?.open;
    changeField(target, target.tagName === 'SELECT' || target.type === 'checkbox' || target.dataset.field.startsWith('baseline.'));
    if (baselineWasOpen) { const baseline = /** @type {HTMLDetailsElement | null} */ (document.getElementById('baseline')); if (baseline) baseline.open = true; }
  }
  if (target.id === 'sort') { sort = target.value; render(); }
  if (target.dataset.discovery && target.checkValidity()) {
    const cityId = /** @type {HTMLElement} */ (target.closest('[data-city]')).dataset.city || '';
    const setting = discovery[cityId];
    if (target.dataset.discovery === 'radius') setting.radius = Number(target.value); else setting.type = target.value;
    render();
  }
  if (target.id === 'import') {
    const file = /** @type {HTMLInputElement} */ (target).files?.[0];
    if (!file) return;
    try {
      if (file.size > 2000000) throw new Error('Comparison files must be under 2 MB. Your current work is unchanged.');
      const imported = validateComparison(JSON.parse(await file.text()));
      state = imported; dashboard = true; render(); notice('Comparison imported. Save it to keep it in this browser.');
    } catch (error) { notice(error instanceof Error ? error.message : 'Import failed. Your current work is unchanged.', true); }
  }
});

main.addEventListener('submit', event => {
  event.preventDefault();
  const form = /** @type {HTMLFormElement} */ (event.target);
  const fd = new FormData(form);
  if (form.id === 'setup') {
    const names = [0, 1, 2].map(n => fd.get(`city-${n}`) === 'manual' ? String(fd.get(`manual-${n}`) || '').trim() : String(fd.get(`city-${n}`) || '')).filter(Boolean);
    if (names.length < 2 || names.length > 3 || new Set(names.map(n => n.toLowerCase())).size !== names.length) return notice('Choose two or three different cities. Give each manual city a name.', true);
    state.cities = names.map(name => newCity(name, state.baseline, data)); dashboard = true; render();
  } else if (form.id === 'add-city') {
    const name = String(fd.get('city') === 'manual' ? fd.get('manual') || '' : fd.get('city') || '').trim();
    if (!name || state.cities.some(c => c.name.toLowerCase() === name.toLowerCase())) return notice('Enter a different city name.', true);
    if (state.cities.length >= 3) return;
    state.cities.push(newCity(name, state.baseline, data)); render();
  }
});

main.addEventListener('click', event => {
  const button = /** @type {HTMLElement | null} */ ((/** @type {HTMLElement} */ (event.target)).closest('[data-action]'));
  if (!button) return;
  const article = /** @type {HTMLElement | null} */ (button.closest('[data-city]'));
  const city = state.cities.find(c => c.id === article?.dataset.city);
  const action = button.dataset.action;
  if (action === 'remove' && city && state.cities.length > 2) { state.cities = state.cities.filter(c => c !== city); render(); }
  if (action === 'restore' && city) { restoreRent(city, data); render(); }
  if (action === 'custom' && city) {
    const input = /** @type {HTMLInputElement} */ (article?.querySelector('[data-custom]'));
    const name = input.value.trim();
    if (!name || city.expenses.some(e => e.name.toLowerCase() === name.toLowerCase())) return notice('Enter a unique custom category name.', true);
    if (city.expenses.length >= 60) return notice('A budget can have up to 60 expense categories.', true);
    city.expenses.push({ id: crypto.randomUUID(), name, amount: null, applicable: true, period: 'monthly', override: true, source: null }); render();
  }
  if (action === 'save') {
    if (!state.name.trim()) return notice('Give your comparison a name before saving.', true);
    try {
      const saved = readLibrary();
      Object.defineProperty(saved, state.name, { value: structuredClone(state), enumerable: true, writable: true, configurable: true });
      localStorage.setItem('citywise.comparisons.v1', JSON.stringify(saved)); render(); notice(`Saved “${state.name}” in this browser.`);
    } catch { notice('Browser storage is unavailable or full. Your work is still open; export a file to keep it.', true); }
  }
  if (action === 'load') {
    const name = /** @type {HTMLSelectElement} */ (document.querySelector('#saved')).value;
    if (!name) return notice('Choose a saved comparison first.', true);
    try { const loaded = validateComparison(readLibrary()[name]); state = loaded; dashboard = true; render(); notice(`Opened “${state.name}”.`); }
    catch (error) { notice(error instanceof Error ? error.message : 'Could not open saved comparison.', true); }
  }
  if (action === 'export') {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = 'citywise-comparison.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Exported. This file contains your personal financial details.');
  }
});

try {
  const response = await fetch('/data/reference.json');
  if (!response.ok) throw new Error('Reference data unavailable');
  data = await response.json();
} catch { notice('Reference data could not load. Manual city budgets are available.', true); }
render();
