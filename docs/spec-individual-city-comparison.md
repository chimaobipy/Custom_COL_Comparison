## Problem Statement

Gen Z adults choosing where to live need to understand whether their own income supports their desired lifestyle in different cities. Household averages and family budgets do not describe an individual's share of rent, transportation choices, debt payments, discretionary spending, or student funding. Salary figures can mislead when household income, resident earnings, occupational wages, and take-home income are presented interchangeably.

Individuals need transparent, editable comparisons that distinguish sourced estimates from personal amounts and show incomplete information honestly. Early-career adults are the primary audience; students must also be able to compare living budgets without treating borrowing as earnings.

## Solution

Build a free, mobile-friendly web app that guides an individual through comparing two or three US cities. Start with editable estimates and shared living preferences, allow city-specific lifestyle adjustments, and show monthly funds, living expenses, monthly remainder, and savings-goal coverage together.

Include clearly separated individual earnings and occupation wage benchmarks, discovery of nearby colleges and universities, and student funding scenarios. Save comparisons in the browser and support file export/import without requiring an account. The initial supported-city target is New York City, Boston, Washington DC, Atlanta, Chicago, Austin, Denver, Seattle, Los Angeles, Philadelphia, Pittsburgh, and Houston, subject to validating source availability. Other cities support manual city budgets.

## User Stories

1. As an early-career adult, I want to compare two or three cities, so that I can evaluate relocation or job opportunities side by side.
2. As an individual, I want a budget for my own income and expenses, so that family assumptions do not distort my comparison.
3. As a new user, I want guided setup, so that I can create a useful comparison without understanding every budget category upfront.
4. As an individual without a current spending history, I want editable starting estimates, so that I can explore cities before tracking actual expenses.
5. As an individual with actual spending records, I want to enter my own amounts, so that the comparison reflects my circumstances.
6. As an individual, I want shared living preferences applied across cities initially, so that I can start with comparable assumptions.
7. As an individual, I want city-specific lifestyle adjustments, so that I can compare realistic alternatives such as transit in one city and a car in another.
8. As an individual, I want departures from the comparison baseline marked, so that I understand why city budgets differ.
9. As an individual, I want to enter monthly take-home income separately for each city, so that the budget uses money actually available to me.
10. As a job seeker, I want to record gross annual salary separately, so that I can retain offer context without mistaking it for take-home income.
11. As a job seeker, I want median and average city-resident earnings, so that I can understand the local earnings reference population.
12. As a job seeker, I want occupation-specific metro wages displayed separately, so that I can explore job-market context without confusing workplaces with city residents.
13. As an individual, I want benchmark population, geography, period, and source visible, so that I can judge whether a figure is relevant to me.
14. As a Gen Z user, I want broader-age earnings figures labeled honestly, so that I do not mistake them for Gen Z-specific salaries.
15. As an individual living alone, I want bedroom-specific rent references, so that the starting housing budget reflects my intended unit size.
16. As an individual with roommates, I want total apartment rent and my personal share shown separately, so that only my share enters my budget.
17. As an individual with an unequal roommate arrangement, I want to edit my rent share, so that the budget reflects the agreed split.
18. As a renter, I want utilities included in a gross rent benchmark identified, so that they are not charged twice.
19. As a renter, I want historical occupied-unit rent distinguished from asking rent, so that I do not mistake the benchmark for an available apartment quote.
20. As an individual, I want housing, utilities, internet, phone, groceries, dining out, transportation, healthcare, debt payments, subscriptions, and entertainment categories, so that I can see where my money goes.
21. As an individual, I want custom categories, so that expenses outside the defaults can be included.
22. As an individual, I want manual overrides retained until I change them or restore a suggestion, so that source updates or unrelated edits do not erase my choices.
23. As an individual, I want source links, dates, and geographic coverage beside estimates, so that I can assess their relevance.
24. As an individual, I want regional or national estimates clearly identified, so that I do not mistake them for observed city costs.
25. As an individual, I want unsupported amounts left unknown, so that absent data does not make a city appear artificially cheap.
26. As an individual, I want incomplete budgets clearly marked, so that I do not treat partial results as complete affordability findings.
27. As an individual, I want monthly living expenses and monthly remainder visible, so that I can understand the effect of changing my budget.
28. As an individual, I want a negative monthly remainder shown directly, so that I can recognize a funding shortfall.
29. As an individual, I want savings goals separate from expenses, so that spending and planned saving remain understandable.
30. As an individual, I want savings-goal coverage shown, so that I can see whether the monthly remainder meets my target.
31. As an individual moving cities, I want one-time moving costs separate from monthly expenses, so that ongoing affordability is not confused with relocation cash needs.
32. As an individual, I want to sort complete results by expenses or monthly remainder, so that I can compare concrete outcomes without an opaque best-city score.
33. As a student, I want to enter work income, grants, family support, and loan proceeds separately, so that I can understand how my living budget is funded.
34. As a student, I want borrowing identified separately from non-borrowed funding, so that cash availability does not imply earnings or debt-free savings.
35. As a student, I want to enter semester or annual funding and expenses with a chosen funding period, so that the app can calculate useful monthly equivalents.
36. As a student, I want tuition entered separately from standard living expenses, so that tuition obligations remain visible alongside grants or loans.
37. As a prospective student or relocating individual, I want nearby two-year and four-year institutions listed, so that I can discover education options around a city.
38. As an individual exploring education, I want institution-type filters, so that I can focus on relevant colleges or universities.
39. As an individual, I want an adjustable discovery radius starting at 25 miles from the city center, so that I can explore a wider or narrower area.
40. As an individual, I want institution names, locations, websites, and straight-line distances, so that I can investigate them without mistaking distance for commute time.
41. As an individual comparing an unsupported city, I want a manual city budget, so that I can still compare my own amounts.
42. As a privacy-conscious individual, I want to use the calculator without an account, so that I do not need to disclose personal financial details to create a comparison.
43. As a returning individual, I want named comparisons saved in my browser, so that I can return to my work.
44. As an individual, I want to export and import comparison files, so that I can back up or transfer my comparison deliberately.
45. As an individual exporting a comparison, I want notice that the file includes my financial details, so that I can handle it knowingly.
46. As a mobile user, I want readable summaries and expandable details, so that I can adjust and compare budgets on a small screen.
47. As an individual, I want free access without ads, subscriptions, or affiliate placements, so that the initial experience focuses on my comparison.

## Implementation Decisions

- This is a new application; no existing application modules, persistence schema, or test suite constrain implementation. Framework and hosting choices are not yet selected. This specification does not require a server or user accounts.
- Organize responsibilities around comparison state and calculations, source-backed reference data, university discovery, browser persistence and file interchange, and the guided setup/comparison interface. These are responsibility boundaries rather than mandated separate services.
- Model a comparison as two or three city budgets plus a shared comparison baseline. Record explicit city-specific departures and preserve manual overrides. Edits scoped to one city must not alter another city's amounts.
- Keep applicable missing amounts distinct from explicit zero amounts and non-applicable categories. Provisional totals must identify missing inputs. Do not use incomplete totals to imply a definitive affordability ranking; incomplete entries must remain visibly distinguishable when sorting.
- Derive monthly living expenses from applicable known recurring expense amounts. For a complete early-career budget, monthly remainder equals monthly take-home income minus monthly living expenses. Savings-goal coverage compares that remainder with the separately recorded savings goal. Negative remainders indicate shortfalls. Unknown income also prevents a definitive remainder.
- In student scenarios, show available monthly student funding, non-borrowed funding, and loan proceeds distinctly. Convert period-based funding and expenses by the chosen positive number of months. Identify whether apparent coverage relies on borrowing; loan proceeds are not salary and debt repayments are expenses distinct from loan proceeds. Tuition is optional and explicit, not silently netted against grants.
- Maintain one-time moving costs outside recurring expense totals. A moving-cost recovery calculation is not required by this spec even though the glossary defines the term.
- Housing inputs distinguish unit size, total apartment rent, and personal rent share. Support unequal splits and editable values by city. Gross rent benchmarks include utility components: disclose those components and reconcile them with separately entered utilities to prevent double counting.
- Preserve source value and metadata independently of personal overrides. Show source, reference period, geographic coverage, population where relevant, and estimate status. Do not present broader-area estimates as city observations or historical rent as current asking rent.
- Use free public sources only. Validate source definitions, reuse terms, geographic identifiers, vintages, and suppression or missing-data flags before incorporating data. When no defensible source exists, offer manual entry rather than manufacturing an estimate. Benchmark refreshes must not silently overwrite personal amounts.
- Candidate city-resident earnings data is Census ACS S2001: matching median and mean annual earnings for resident workers aged 16+ who worked full time, year round and had earnings. Candidate occupational data is BLS OEWS metropolitan wages. Do not blend these resident- and workplace-based populations or substitute household income. Choose and document a validated release during implementation.
- Candidate bedroom rent data is Census ACS B25031 median gross rent. It describes occupied cash-rent units, not current vacancies; it does not supply a bedroom-specific mean rent that can be invented or inferred from its median.
- Candidate institution data is NCES IPEDS, with institution and campus-location validation. Include two-year and four-year colleges/universities, initially excluding standalone trade schools and non-degree providers. Calculate straight-line miles from a documented city-center coordinate, defaulting to a 25-mile radius. Do not imply commute-time estimates or satellite-campus coverage from a main-campus coordinate.
- Save named comparisons in browser storage and support a versioned comparison-file format. Preserve user amounts, baseline preferences, city-specific changes, overrides, funding periods, and source metadata across save/reload/export/import. Validate imported content before applying it, and do not destroy an existing comparison when an import is invalid. Handle unavailable storage with a visible message rather than false confirmation of saving.
- Provide guided setup and a responsive dashboard. Prioritize income/funding, expenses, remainder, and savings-goal coverage; keep detailed expenses expandable and source explanations adjacent to their figures. Keep forms labeled and usable with keyboard input.
- The twelve-city list is a coverage target, not permission to claim missing data exists. Unsupported or insufficiently sourced city budgets remain manually editable and clearly labeled.

## Testing Decisions

- Confirmed primary test seam: externally observable behavior through the rendered application in a browser, covering the complete comparison workflow. The user approved this approach before publication.
- There is no application test prior art in the current repository. Prefer a small set of high-value end-to-end scenarios over tests that mirror component structure, state internals, or arithmetic implementation.
- Exercise the comparison interface, calculation outcomes, reference-data presentation, and browser persistence/file interchange through that single application boundary wherever practical. Use controlled reference-data fixtures for reproducible assertions; separately validate the production data snapshot's required metadata and missing-data handling.
- Verify that editing a city's income or expense changes only that city; baseline and city-specific preferences remain distinguishable; adding/removing a third city preserves the others.
- Verify explicit zeros, missing expenses, missing income, custom categories, and negative remainders. A missing applicable amount must yield incomplete/provisional results and must not silently win an affordability comparison.
- Verify roommate splits with a concrete case: a personal share of $1,200 from $2,400 total rent contributes $1,200 to the individual budget. Cover unequal splits and included utilities without duplication.
- Verify monthly normalization with a concrete student case: a $6,000 grant covering four months contributes $1,500 monthly funding. Entered tuition remains a separate expense; loan proceeds are disclosed distinctly; repayments are not confused with proceeds. Reject zero or negative funding periods.
- Verify savings-goal coverage separately from expenses, including negative remainders and borrowing-dependent student funding. One-time moving costs must not change recurring monthly living expenses.
- Verify city-resident earnings and metro occupational wages retain distinct population/geography labels and never populate take-home income automatically. Broader-area expense estimates and historical gross rent retain source/period/coverage explanations.
- Verify institution filtering and radius boundaries using known coordinates, including the default 25-mile radius and the straight-line-distance label.
- Verify save/reload and export/import round trips preserve the comparison. Malformed or incompatible files must show an actionable error without destroying current work. Verify storage-failure feedback.
- Verify core setup, editing, and comparison tasks at mobile and desktop widths, including keyboard operation, labeled inputs, visible validation errors, and expandable detail access.

## Out of Scope

- Family budgets, children/dependents, or household income used as individual salary.
- International comparisons, currency conversion, or a complete nationwide sourced dataset at launch.
- Automatic tax calculations or converting gross salary into estimated take-home pay automatically.
- Bank connections, account creation, cloud financial-data synchronization, and public sharing links.
- Live apartment listings, guaranteed available rents, commute routing, or commute-time estimates.
- Standalone trade schools and non-degree providers; a complete college affordability or financial-aid eligibility calculator.
- Opaque composite best-city scores or unsupported Gen Z-specific salary claims.
- Paid datasets, ads, subscriptions, affiliate placements, and monetization features.
- Hosting publication or purchases solely on the authority of this specification. App implementation was approved; deployment remains a separate scope decision.

## Further Notes

- The user completed the design interview and explicitly approved moving into implementation. This spec synthesizes those decisions; it does not restart the product interview.
- The user confirmed the testing seam and authorized publishing to the configured GitHub issue tracker with the `ready-for-agent` label.
- Source feasibility has been researched, but the production datasets have not been ingested or validated. Category-level source selection and refresh cadence are implementation research tasks governed by the data policy above.
- Official source references: [Census earnings metadata](https://api.census.gov/data/2024/acs/acs1/subject/groups/S2001.html), [BLS metropolitan occupational wages](https://www.bls.gov/OES/current/oessrcma.htm), [Census bedroom rent](https://data.census.gov/table/ACSDT1Y2024.B25031), and [NCES IPEDS directory](https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx).
