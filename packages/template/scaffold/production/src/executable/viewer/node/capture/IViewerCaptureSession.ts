import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Exclusive capture access to one opened draw-only page. Await each capture before another and close exactly once on success or failure.
 *
 * @evidence contracts/development/design.md#principled-representation Capture and close are the two operations needed to use and release the page.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Seconds in and awaited PNG bytes out leave file paths, metadata and encoding with the caller.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The session does not hide failures or retry frames.
 * @evidence contracts/development/common.md#meaningful-documentation States exclusivity and release.
 */
export interface IViewerCaptureSession {
  /**
   * Draw the film at `seconds` in every requested pass through the page's draw function, then await the writer for each pass's PNG, in pass order. Calls must not overlap. Page failures are classified; writer failures propagate unchanged.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Every pass is drawn by the page's draw function from the same placed second, so the frames of one instant differ only in what they draw.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Byte delivery separates drawing from consumer naming, file writing and encoding.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No screenshot and no injected style; writer failures are not retried or suppressed.
   * @evidence contracts/development/common.md#meaningful-documentation States the order, non-overlap and failure propagation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One draw call, one PNG encoding and one write for each of P passes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The page and its created film serve every frame; different frames and effectful writes cannot be cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Non-overlap and awaited delivery keep one frame's passes in flight; writers own anything retained, while the session remains responsible for page close.
   */
  capture(
    seconds: number,
    write: (pass: AutoMovieGuidePass, bytes: Uint8Array) => Promise<void>,
  ): Promise<void>;

  /**
   * Release the page exactly once when capture ends. A rejection propagates unchanged. The enclosing browser remains caller-owned.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Release delegates to the browser driver's page close, the owner API for that handle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure No output or options are needed to close this one owned page.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The session neither swallows close failures nor retries teardown.
   * @evidence contracts/development/common.md#meaningful-documentation States exact-once release, failure propagation and separate browser ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms The implementation forwards one driver call; browser teardown work belongs to the driver.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Close is a one-time effect with no reusable result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This is the session page release point; no browser handle is acquired or released here.
   */
  close(): Promise<void>;
}
