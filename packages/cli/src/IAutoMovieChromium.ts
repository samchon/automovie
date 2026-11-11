import type { IAutoMovieDrawPage } from "@automovie/render";

/**
 * The part of `playwright-core`'s `chromium` the capture host calls, declared structurally so the command loads the production's own Playwright at run time and a test passes a double.
 *
 * @evidence contracts/development/design.md#principled-representation Playwright's own call shapes: launch with switches, then pages and a version from the browser.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly what `launchAutoMovieChromium` and the capture host call; the page is the draw session's structural page.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No Playwright type is imported, so the command compiles and installs without Playwright, which is an optional peer.
 * @evidence contracts/development/common.md#meaningful-documentation States who satisfies it and why it is structural.
 */
export interface IAutoMovieChromium {
  /**
   * Start a headless browser with the given switches, from `executablePath` when given.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is started and from where.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; Playwright answers.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; Playwright answers.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; Playwright answers.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; Playwright answers.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; Playwright answers.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; Playwright answers.
   */
  launch(options: {
    headless: true;
    args: string[];
    executablePath?: string;
  }): Promise<IAutoMovieChromium.IBrowser>;
}
export namespace IAutoMovieChromium {
  /**
   * A launched browser: its version, its pages, and its end.
   *
   * @evidence contracts/development/design.md#principled-representation Playwright's `Browser` call shapes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three calls the host makes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Structural, as its parent.
   * @evidence contracts/development/common.md#meaningful-documentation States what it is.
   */
  export interface IBrowser {
    /**
     * The browser's version, such as `131.0.6778.33`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States what is returned.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; Playwright answers.
     */
    version(): string;

    /**
     * Open a fresh page.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the effect.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; Playwright answers.
     */
    newPage(): Promise<IAutoMovieDrawPage>;

    /**
     * End the browser and every page it holds.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the effect.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature has no body; Playwright answers.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature has no body; Playwright answers.
     */
    close(): Promise<void>;
  }
}
