/**
 * The element handle the capture adapter screenshots once per frame and pass.
 *
 * A Playwright `Locator` satisfies it structurally. The adapter obtains it once
 * per session through `IAutoMovieHeadlessPage.locator` and reuses it for every
 * frame, so the selector is resolved again by the host at each screenshot.
 *
 * @evidence contracts/development/design.md#principled-representation The surface is the one Playwright locator method the adapter calls, declared structurally so any host with the same call shape works without an adapter-specific wrapper.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One method is declared because the adapter uses exactly one, which keeps fakes and alternative browser drivers small.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The interface names no browser vendor, test double or route, and the adapter does not inspect the implementation behind it.
 * @evidence contracts/development/common.md#meaningful-documentation The doc says which page call produces it, that it is reused across frames, and that a Playwright locator fits as is.
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
   * @evidence contracts/development/implementation.md#principled-implementation PNG is requested explicitly because frame files are named `.png` and encoded losslessly, so the bytes on disk are exactly the pixels the page rendered.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The option object mirrors Playwright's screenshot options with the single field the adapter sets, so the host call needs no translation layer.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The method does not let the adapter pick a format per caller or fixture, and the adapter never post-processes the returned bytes.
   * @evidence contracts/development/common.md#meaningful-documentation The doc says when it is called, how a rejection and an empty result are classified, and that the bytes reach `writeFrame` unchanged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The declaration has no body; rasterizing and PNG encoding are performed by the host browser.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Every call captures a different frame or pass state, so no two screenshots are equivalent work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned bytes belong to the adapter only until `writeFrame` resolves; the adapter keeps no reference afterwards, so at most one frame's PNG is held per in-flight call.
   */
  screenshot(options: { type: "png" }): Promise<Uint8Array>;
}
