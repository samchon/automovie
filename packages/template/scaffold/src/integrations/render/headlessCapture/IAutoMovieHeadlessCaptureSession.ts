import type { IAutoMovieRenderAdapters } from "@automovie/render";

/**
 * An open capture session returned by `createHeadlessCaptureAdapter`.
 *
 * The session owns the page from the moment it is returned. The caller must
 * call `close` exactly once when capture ends, whether it succeeded or failed.
 * Frames may be captured in any order, but calls must not overlap, because
 * every call moves the one shared viewer to its own time and pass.
 *
 * @evidence contracts/development/design.md#principled-representation Returning the capture function together with its release keeps the page lifetime explicit, and `captureFrame` has `renderVideo`'s adapter signature so the session plugs into the render loop directly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, the frame capture and the page release, are everything a render loop needs from a capture session; creation-time work stays in the factory.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The session does not close the page by itself on a failed frame, so the caller's cleanup path stays the single release point.
 * @evidence contracts/development/common.md#meaningful-documentation The doc states ownership of the page, the caller's obligation to close once on every outcome, and the prohibition on overlapping captures with its reason.
 */
export interface IAutoMovieHeadlessCaptureSession {
  /**
   * Capture frame `index` at `timeSeconds` into `dir` for every configured
   * pass and return the path `renderVideo` should encode: the `beauty` path
   * when `beauty` is among the passes, otherwise the first pass's path.
   */
  captureFrame: IAutoMovieRenderAdapters["captureFrame"];

  /**
   * Close the session's page.
   *
   * Resolves when the page has closed. A rejection from the page propagates
   * unwrapped. The session is unusable afterwards.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Release goes through the page's own `close`, the host's documented teardown, and nothing else holds state that needs disposal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The method takes no arguments and returns no value because closing has no options and no result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failing close is surfaced rather than retried or ignored, so a leaked page is visible to the caller.
   * @evidence contracts/development/common.md#meaningful-documentation The doc says what it closes, when it resolves, how a failure surfaces, and that the session cannot be used after it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Closing forwards one call and performs no computation of its own.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A release happens once per session and produces nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This is the release point of the session's single page handle; the browser that created the page remains the caller's to close.
   */
  close(): Promise<void>;
}
