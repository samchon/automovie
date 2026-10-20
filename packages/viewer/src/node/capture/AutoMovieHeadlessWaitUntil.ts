/**
 * The navigation milestone `IAutoMovieHeadlessPage.goto` waits for before the
 * capture adapter looks for the viewer's hooks.
 *
 * The members are Playwright's `page.goto` `waitUntil` values, so a Playwright
 * page satisfies the adapter's page surface without translation. The adapter
 * defaults to `load`.
 *
 * @evidence contracts/common.md#principled-implementation The union copies the four milestones Playwright's documented `goto` option accepts, so the value passes through to the host page unchanged and the adapter never maps or reinterprets it.
 * @evidence contracts/common.md#clear-and-simple-design A named alias keeps the milestone list in one place for both the page method and the capture option that forwards to it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No milestone is added or dropped for a particular viewer route, and the union is Playwright's own list rather than one chosen for a fixture.
 * @evidence contracts/common.md#meaningful-documentation The doc says where the value is consumed, that its members are Playwright's own so a real page fits, and which milestone the adapter uses when none is given.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The alias is erased by the compiler and computes nothing at run time.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A navigation milestone is an option value forwarded once per session, with no derived result to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The value is a literal string held in the caller's options object and owns no page, socket or timer.
 */
export type AutoMovieHeadlessWaitUntil =
  | "commit"
  | "domcontentloaded"
  | "load"
  | "networkidle";
