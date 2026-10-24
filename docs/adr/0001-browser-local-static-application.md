# ADR 0001: Browser-local static application

Status: Accepted

Use a static HTML/CSS/JavaScript application with no runtime framework or server
dependencies. TypeScript checks JavaScript using JSDoc and a shared type schema.
Playwright tests observe behavior through the rendered browser interface, the
specification's approved testing seam.

The comparison model and calculations live separately from DOM rendering and
interaction handlers. Reference data is a pinned, reproducibly generated public
snapshot. Reference source metadata is retained independently of manual overrides.
Changing shared preferences updates matching city preferences while retaining
manual amounts; restoring a suggestion is an explicit user action.

Named comparisons live in localStorage with a versioned JSON representation.
Import validates before applying, and storage failure is visible. There is no
server-side financial processing, tax estimation, analytics, account, or sync.
Google Fonts supplies optional typography; system fonts provide a fallback.
Institution and statistical source links open outside sites when selected.

This choice supports inexpensive static hosting later, but does not authorize
publication. All app state and public reference assets can be served locally.
