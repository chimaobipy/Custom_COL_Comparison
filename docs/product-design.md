# Individual city cost-of-living calculator

Status: Shared understanding confirmed by the user; implementation approved. The implementation specification records the detailed scope and confirmed test approach.

## Purpose and audience

Help Gen Z adults answer: “Which city can I afford, and what lifestyle would my income support there?” Prioritize early-career adults and support student scenarios. Budget for one individual, never a family; roommates affect only the individual’s share of expenses. Age alone does not determine expenses.

## Launch scope

Compare two or three US cities. Initial supported cities: New York City, Boston, Washington DC, Atlanta, Chicago, Austin, Denver, Seattle, Los Angeles, Philadelphia, Pittsburgh, and Houston. Coverage is subject to validating source availability. Unsupported cities allow manual budgets.

Use free public data. Launch free without ads, subscriptions, or affiliate placements. No account required. Store personal financial details in the browser; support comparison-file export and import. Exported files contain entered financial information.

## Comparison experience

Use guided setup followed by a responsive, mobile-friendly comparison dashboard with expandable expense details. Start from editable estimates without requiring current spending. Users may replace estimates with actual amounts.

Apply shared living preferences initially, then allow explicit city-specific differences, such as roommates, car versus transit, discretionary spending, debt payments, and savings goals. Clearly mark differences that explain cost changes.

Prominently show monthly take-home income or student funding, living expenses, monthly remainder, and savings-goal coverage. Monthly remainder is available funds minus living expenses. Show student loan proceeds separately from non-borrowed funding; borrowing is not earnings. Distinguish a cash-funded remainder from savings funded without borrowing.

Allow sorting by expenses or remainder. Do not create a composite “best city” score. An applicable missing amount is unknown, never zero. Mark incomplete budgets and dependent results as provisional; do not present their totals or rankings as complete affordability findings.

## Income and salary references

Users enter monthly take-home income for each city. Gross annual salary may be shown separately; automatic tax estimation is excluded initially.

Show median and average annual individual earnings for city residents aged 16+ who worked full time, year round and had earnings. Explicitly identify this as a broader age population than Gen Z. Keep occupation-specific metropolitan wages separate from city-resident earnings and from budget income. Show population, geography, period, and source. Never substitute household income for individual salary.

Students may enter work income, grants, family support, and loan proceeds. Allow semester or annual amounts and a user-selected number of months to convert both funding and expenses into monthly equivalents. Tuition remains a separate optional expense; grants do not erase tuition obligations from the budget.

## Expenses and housing

Default categories: housing, utilities, internet, phone, groceries, dining out, transportation, healthcare, debt payments, subscriptions, and entertainment. Allow custom categories. Show savings goals separately from expenses. Keep one-time moving costs separate from recurring expenses.

Housing supports living alone and sharing an apartment, with editable total rent and personal share for each city. Allow unequal roommate splits. Use bedroom-specific median gross rent as an explicitly historical benchmark for occupied rentals, not current asking rents. Disclose included utilities and avoid counting them twice when adding other expense categories.

## Data policy

Prefer defensible city estimates; allow labeled broader regional or national estimates where local data is unavailable. Show source, period, actual geographic coverage, and estimate status. If no defensible estimate exists, leave the category unknown and allow manual entry. Do not invent medians, local precision, or current listing prices.

Validate releases, geographic identifiers, definitions, suppression flags, source usage terms, and coverage before shipping. Do not silently mix incompatible salary populations or expense definitions. Refresh cadence and concrete category-source selection remain implementation research tasks; no paid datasets are authorized.

Candidate official references researched during the interview:

- Census ACS S2001: matching median/mean earnings for full-time, year-round resident workers. https://api.census.gov/data/2024/acs/acs1/subject/groups/S2001.html
- BLS OEWS: occupation-specific metropolitan wages; different population from city residents. https://www.bls.gov/OES/current/oessrcma.htm
- Census ACS B25031: median gross rent by bedroom count; occupied units, including utility components. https://data.census.gov/table/ACSDT1Y2024.B25031
- NCES IPEDS institutional directory: institution identities and coordinates, requiring campus/location validation. https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx

These are candidate sources, not a claim that all requested expense categories have verified datasets.

## University discovery

Include two-year and four-year colleges and universities with institution-type filters. Initially exclude standalone trade schools and non-degree providers. Show institution name, location, website, and straight-line distance from the city center. Default to a 25-mile radius with an adjustable radius. Distances do not represent commute times or proximity to a future apartment. Do not imply main-campus coordinates cover every satellite campus. Tuition is excluded from the standard living budget and may be entered separately.

## Excluded from the first release

Bank connections, automatic tax calculations, live apartment listings, commute routing, public sharing links, family budgets, paid subscriptions, ads, and affiliate placements.

## Verification priorities for implementation

- Changing a source amount or personal override updates the correct city only unless editing the shared baseline.
- Unequal housing splits and included utilities do not duplicate expenses.
- Missing amounts produce incomplete results rather than false zero-cost budgets.
- Earnings benchmarks do not become take-home income automatically.
- Student loans, repayments, grants, tuition, and funding periods remain distinct.
- Saved/exported/imported comparisons preserve amounts, overrides, preferences, and source metadata.
- Source geography and period remain visible, including broader-area estimates.

## Next step

Implement the confirmed specification and resolve technical choices against this scope. This document records product decisions; it does not authorize publishing a site or purchasing data.
