/**
 * The browser page a draw session drives, declared as the five Playwright `Page` methods it calls, so a Playwright page fits as it is and a test passes a recording double.
 *
 * Functions handed to `addInitScript`, `waitForFunction` and `evaluate` run inside the page, so they read only their argument.
 *
 * @evidence contracts/development/design.md#principled-representation Structural typing over the driver's own call shapes keeps `render` free of a browser driver while any driver with those shapes satisfies it unchanged.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the calls `AutoMovieDrawSession` makes: inject the props, load, wait for the draw function, call it, close. No screenshot, style injection or element lookup is declared, because pictures come only from the draw function.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No method names a host or a subject.
 * @evidence contracts/development/common.md#meaningful-documentation States who satisfies it and the rule for functions that run in the page.
 */
export interface IAutoMovieDrawPage {
  /**
   * Run `script(arg)` in the page before any of its own scripts, on every load.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when the script runs.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the browser driver answers.
   */
  addInitScript<T>(script: (arg: T) => void, arg: T): Promise<unknown>;

  /**
   * Load an address, resolving at the `load` event.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when it resolves.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the browser driver answers.
   */
  goto(url: string, options: { waitUntil: "load" }): Promise<unknown>;

  /**
   * Resolve once `predicate(arg)`, run in the page, is truthy; reject after `options.timeout` milliseconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when it resolves and rejects and the unit of the timeout.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the browser driver answers.
   */
  waitForFunction<T>(
    predicate: (arg: T) => unknown,
    arg: T,
    options: { timeout: number },
  ): Promise<unknown>;

  /**
   * Run `task(arg)` in the page and resolve with its JSON result, awaiting a returned promise; a throw in the page rejects with its message.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is returned and what a page failure does.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the browser driver answers.
   */
  evaluate<R, T>(task: (arg: T) => R | Promise<R>, arg: T): Promise<R>;

  /**
   * Close the page.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the effect.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; the browser driver answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; the browser driver answers.
   */
  close(): Promise<unknown>;
}
