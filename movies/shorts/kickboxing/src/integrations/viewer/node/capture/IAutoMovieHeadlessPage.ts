import type { AutoMovieHeadlessWaitUntil } from "./AutoMovieHeadlessWaitUntil.js";
import type { IAutoMovieHeadlessLocator } from "./IAutoMovieHeadlessLocator.js";

/**
 * The browser page the capture adapter drives, declared as the six Playwright
 * `Page` methods it calls so a Playwright page fits structurally.
 *
 * The caller opens the page and passes it in. If `createHeadlessCaptureAdapter`
 * rejects, the page stays open and remains the caller's to close; once it
 * resolves, the returned session owns the page and its `close` closes it.
 *
 * @evidence contracts/development/design.md#principled-representation Structural typing over the Playwright methods the adapter calls keeps the viewer capture transport independent of a browser driver while a real Playwright page, or any driver with the same call shapes, satisfies it unchanged.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interface lists exactly the methods the adapter calls, with the option shapes it passes, so the browser boundary is visible in one declaration and a test double implements only what is used.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No method exists for a particular viewer or test, and the adapter reaches the page only through these calls rather than patching browser globals from Node.
 * @evidence contracts/development/common.md#meaningful-documentation The doc says who opens the page, who closes it on a failed creation, and when ownership passes to the session.
 */
export interface IAutoMovieHeadlessPage {
  /**
   * Navigate to the viewer route, resolving once `options.waitUntil` is
   * reached.
   *
   * Called once per session, first. A rejection becomes a `route` error. The
   * resolved value is ignored.
   *
   * @param url The capture route exactly as the caller supplied it.
   * @param options The milestone to wait for.
   * @evidence contracts/development/implementation.md#principled-implementation Navigation completes before any hook lookup because the viewer defines its seek and pass globals while loading, so waiting for the chosen milestone is what makes the following hook checks meaningful.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The method takes only the URL and the wait option the adapter forwards, matching Playwright's signature so no wrapper sits between them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The adapter forwards the caller's URL without rewriting query parameters or adding route-specific flags.
   * @evidence contracts/development/common.md#meaningful-documentation The doc states the call order, the error code a rejection maps to, and that the return value is unused.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The declaration has no body; page loading is the browser's work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The adapter navigates once per session and every frame reuses that loaded document, seeking instead of reloading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Navigation reuses the page handle already counted on the interface and acquires nothing the adapter must release separately.
   */
  goto(
    url: string,
    options: { waitUntil: AutoMovieHeadlessWaitUntil },
  ): Promise<unknown>;

  /**
   * Resolve once `predicate(arg)`, run in the page, returns a truthy value.
   *
   * The adapter uses it to wait for the seek global and, when guide passes are
   * requested, the pass global, each named by `arg`. A rejection, such as the
   * host's timeout, becomes a `seek-hook` or `pass-hook` error.
   *
   * @param predicate Page-side check; it must use only its argument because it
   *   is serialized into the page.
   * @param arg Serializable argument passed to `predicate`.
   * @evidence contracts/development/implementation.md#principled-implementation Polling a page-side predicate is Playwright's documented way to wait for script state, and passing the global's name as an argument keeps the serialized predicate free of closure variables.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A generic argument type lets the same declaration carry the hook name without a capture-specific overload.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The adapter imposes no timeout or retry of its own; it relies on the host's wait and reports the host's rejection as is.
   * @evidence contracts/development/common.md#meaningful-documentation The doc says what the adapter waits for, the constraint that the predicate use only its argument, and how a rejection is classified.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The wait strategy and polling interval belong to the host implementation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Hook existence is polled once per session at creation; frames reuse that readiness check while separately awaiting each hook invocation through evaluate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Any polling timer is the host's and ends when the returned promise settles; the adapter holds nothing from it.
   */
  waitForFunction<T>(predicate: (arg: T) => unknown, arg: T): Promise<unknown>;

  /**
   * Add a style element with `options.content` to the page.
   *
   * The adapter calls it once per session, unless `hideSelector` is `null`,
   * to hide viewer controls from screenshots. A rejection becomes a `capture`
   * error.
   *
   * @param options The CSS text to inject.
   * @evidence contracts/development/implementation.md#principled-implementation Hiding chrome with an injected `display:none!important` rule uses the cascade the page already honors, so the viewer's own code is not modified to produce clean frames.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The method takes only `content` because the adapter never injects a style sheet by URL or path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The injected rule targets only the caller's selector and changes no other element or viewer behavior.
   * @evidence contracts/development/common.md#meaningful-documentation The doc says when the adapter calls it, why, when it is skipped, and what a rejection becomes.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The declaration has no body; style recalculation is performed by the browser.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The rule is injected once per session and stays in the document for every later frame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The style element lives in the page document and is released with the page; the adapter keeps no reference to it.
   */
  addStyleTag(options: { content: string }): Promise<unknown>;

  /**
   * Run `task(arg)` in the page and resolve when it finishes.
   *
   * The adapter uses it to call the seek global with the frame time and, for
   * guide passes, the pass global with the pass name. A rejection becomes a
   * `seek-hook` or `pass-hook` error. The resolved value is ignored.
   *
   * @param task Page-side function; it must use only its argument because it
   *   is serialized into the page.
   * @param arg Serializable argument passed to `task`.
   * @evidence contracts/development/implementation.md#principled-implementation Driving the viewer through a page-side call is Playwright's documented evaluation contract, and passing the hook name and value as an argument keeps the serialized function self-contained.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One generic method serves both hooks because each is a single global call with one argument.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The adapter evaluates only the named hook with the frame's own time or pass and never evaluates code that alters the viewer for capture.
   * @evidence contracts/development/common.md#meaningful-documentation The doc says which hooks the adapter calls through it, the serialization constraint, and how a rejection is classified.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The declaration has no body; script execution belongs to the host page.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each evaluation moves the viewer to a different time or pass state, so none repeats another.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources An evaluation acquires nothing that outlives its promise, and the adapter discards its result.
   */
  evaluate<T>(task: (arg: T) => unknown, arg: T): Promise<unknown>;

  /**
   * Return a handle to the element matching `selector`.
   *
   * The adapter calls it once per session with `viewSelector` and screenshots
   * through the returned handle for every frame.
   *
   * @param selector The caller's view selector, `#view` by default.
   * @evidence contracts/development/implementation.md#principled-implementation A lazy locator re-resolves its selector at each screenshot, which is Playwright's documented behavior, so one handle stays valid even if the viewer replaces the element between frames.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The method synchronously constructs the supplied selector's locator without a separate wrapper. If a host implementation throws during construction, creation rejects with that original error; this call is outside the adapter's classified page guards.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The adapter passes the caller's selector unchanged and never chooses an element for a particular viewer.
   * @evidence contracts/development/common.md#meaningful-documentation The doc says when it is called, with which selector, and that the handle is reused for all frames.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Creating a locator performs no query; element resolution happens in the host at screenshot time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The adapter creates one locator per session and every frame and pass reuses it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The locator is a lightweight description bound to the page and is released with it.
   */
  locator(selector: string): IAutoMovieHeadlessLocator;

  /**
   * Close the page.
   *
   * Called only by the session's `close`, never by a failed creation. The
   * resolved value is ignored, and a rejection propagates unwrapped.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Closing the page through its own method is the host's documented release path, and the adapter calls it only after it has taken ownership.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The method takes no options because the adapter needs no unload handlers or reason text.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A close failure is not swallowed or retried; it reaches the caller of the session's `close`.
   * @evidence contracts/development/common.md#meaningful-documentation The doc says which code path calls it, that a failed creation does not, and that a rejection is not wrapped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The declaration has no body; tearing down the page is the browser's work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Closing is a one-time release with no result to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This is the release point of the page handle the session owns; the browser that created the page stays the caller's.
   */
  close(): Promise<unknown>;
}
