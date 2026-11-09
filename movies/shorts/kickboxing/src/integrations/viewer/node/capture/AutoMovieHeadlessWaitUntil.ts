/**
 * The navigation milestone `IAutoMovieHeadlessPage.goto` waits for before the
 * capture adapter looks for the viewer's hooks.
 *
 * The members are Playwright's `page.goto` `waitUntil` values, so a Playwright
 * page satisfies the adapter's page surface without translation. The adapter
 * defaults to `load`.
 *
 * @evidence contracts/development/design.md#principled-representation The union copies the four milestones Playwright's documented `goto` option accepts, so the value passes through to the host page unchanged and the adapter never maps or reinterprets it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A named alias keeps the milestone list in one place for both the page method and the capture option that forwards to it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No milestone is added or dropped for a particular viewer route, and the union is Playwright's own list rather than one chosen for a fixture.
 * @evidence contracts/development/common.md#meaningful-documentation The doc says where the value is consumed, that its members are Playwright's own so a real page fits, and which milestone the adapter uses when none is given.
 */
export type AutoMovieHeadlessWaitUntil =
  | "commit"
  | "domcontentloaded"
  | "load"
  | "networkidle";
