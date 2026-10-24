# Citywise · Custom cost of living comparison

A private, browser-local comparison of individual budgets in two or three US
cities. Includes guided setup, roommate rent shares, student funding, explicit
unknown amounts, savings goals, custom expenses, college discovery, and named
browser saves with versioned JSON export/import. No account or backend is needed.

## Local development

Requires Node.js 22+ and pnpm.

```sh
pnpm install
pnpm dev
```

Open [the local app](http://127.0.0.1:5173). To build a static distribution:

```sh
pnpm typecheck
pnpm test
pnpm build
node scripts/serve.mjs --dist
```

Browser tests use installed Google Chrome by default. For other environments,
install Playwright Chromium (`pnpm exec playwright install chromium`) and remove
`channel: 'chrome'` from `playwright.config.js`. Tests exercise the rendered app,
including mobile/desktop keyboard use, reference labels, calculation outcomes,
storage failures, and import/export. No personal financial data is sent to a
server. External source and institution links open only when selected.

## Reference data

The checked-in snapshot includes 2024 ACS bedroom gross rents and median
individual resident earnings for twelve cities; dated BLS occupational wage
references; and NCES IPEDS institution locations. All remaining costs start
unknown and accept personal amounts. These are historical references, not
apartment quotes or a salary prediction. Census mean earnings remain unavailable
without a Census API key; the interface reports them as unknown. BLS annual
median equivalents are derived from hourly medians and labeled as approximations.

See [source definitions and refresh instructions](docs/data-sources.md).
Refresh public data with `python3 scripts/refresh-data.py`. This never changes
saved personal budgets. Set `CENSUS_API_KEY` in the environment to retrieve
matching S2001 median/mean references; the key is not included in output.

Browser storage is device/browser-specific. Export deliberately to back up or
transfer your work; exported files contain your entered financial details.
Imports are validated before replacing the current comparison. Version 1 files
require two or three complete city records, although their amounts may be unknown.

Implementation tracks GitHub issue #1 and
[the approved specification](docs/spec-individual-city-comparison.md).
Deployment is outside this implementation scope.
