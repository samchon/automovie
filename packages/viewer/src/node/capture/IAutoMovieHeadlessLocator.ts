/**
 * The element handle the capture adapter screenshots once per frame and pass.
 *
 * A Playwright `Locator` satisfies it structurally. The adapter obtains it once
 * per session through `IAutoMovieHeadlessPage.locator` and reuses it for every
 * frame, so the selector is resolved again by the host at each screenshot.
 *
 * @evidence contracts/common.md#principled-implementation The surface is the one Playwright locator method the adapter calls, declared structurally so any host with the same call shape works without an adapter-specific wrapper.
 * @evidence contracts/common.md#clear-and-simple-design One method is declared because the adapter uses exactly one, which keeps fakes and alternative browser drivers small.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interface names no browser vendor, test double or route, and the adapter does not inspect the implementation behind it.
 * @evidence contracts/common.md#meaningful-documentation The doc says which page call produces it, that it is reused across frames, and that a Playwright locator fits as is.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface declares a call shape and runs no algorithm; screenshot cost belongs to the host implementation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The locator itself is the shared result, obtained once per session by the adapter; the interface declares nothing further to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The locator owns no resource of its own; the page that backs it is released by the session's `close`.
 * @author Samchon
 */
export interface IAutoMovieHeadlessLocator {
  /**
   * Capture the located element as encoded PNG bytes.
   *
   * The adapter calls it once per frame and pass, after the seek hook and, for
   * a guide pass, the pass hook have run. A rejection becomes a `capture`
   * error, and a zero-length result becomes an `empty-frame` error. The
   * returned array is handed to `writeFrame` unchanged.
   *
   * @param options Always `{ type: "png" }`, the format every frame file uses.
   * @evidence contracts/common.md#principled-implementation PNG is requested explicitly because frame files are named `.png` and encoded losslessly, so the bytes on disk are exactly the pixels the page rendered.
   * @evidence contracts/common.md#clear-and-simple-design The option object mirrors Playwright's screenshot options with the single field the adapter sets, so the host call needs no translation layer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The method does not let the adapter pick a format per caller or fixture, and the adapter never post-processes the returned bytes.
   * @evidence contracts/common.md#meaningful-documentation The doc says when it is called, how a rejection and an empty result are classified, and that the bytes reach `writeFrame` unchanged.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The declaration has no body; rasterizing and PNG encoding are performed by the host browser.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Every call captures a different frame or pass state, so no two screenshots are equivalent work.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The returned bytes belong to the adapter only until `writeFrame` resolves; the adapter keeps no reference afterwards, so at most one frame's PNG is held per in-flight call.
   */
  screenshot(options: { type: "png" }): Promise<Uint8Array>;
}
