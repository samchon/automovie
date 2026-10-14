import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Exclusive capture access to one initialized page. Await each capture before another and close exactly once on success or failure. Sample values must be serializable and understood by the selected page hook.
 *
 * @evidence contracts/common.md#principled-implementation Capture and close expose the two operations needed to use and release the page without importing Render types.
 * @evidence contracts/common.md#clear-and-simple-design Samples and awaited byte delivery leave file paths, metadata and encoding with the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The session does not hide failures or retry samples.
 * @evidence contracts/common.md#meaningful-documentation States serialization, exclusivity, release and hook override requirements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The factory implements page reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The session owns one page until explicit close; writers independently own retained bytes.
 * @author Samchon
 */
export interface IViewerCaptureSession {
  /**
   * Seek one serializable sample, then await the writer for each requested pass. The optional hook overrides the session seek function for this call; it must already exist on the initialized page. Calls must not overlap. Page failures are classified; writer failures propagate unchanged.
   *
   * @evidence contracts/common.md#principled-implementation Explicit hook samples select viewer state before screenshotting; ordered awaited writers preserve pass identity and consumer backpressure.
   * @evidence contracts/common.md#clear-and-simple-design Byte delivery separates page observation from consumer naming, file writing and encoding.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The sample reaches the selected public hook unchanged and writer failures are not retried or suppressed.
   * @evidence contracts/common.md#meaningful-documentation States serializability, hook existence, non-overlap, write ordering and failure propagation.
   * @evidence contracts/performance.md#efficient-algorithms The implementation seeks once and performs one screenshot and write for each of P passes, O(P) browser calls and image-sized transient bytes.
   * @evidence contracts/performance.md#reuse-equivalent-work Capture reuses the session page and locator; different samples and effectful writes cannot be cached.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Non-overlap and awaited delivery keep one screenshot buffer in flight; writers own anything retained, while the session remains responsible for page close.
   */
  capture(
    sample: unknown,
    write: (pass: AutoMovieGuidePass, bytes: Uint8Array) => Promise<void>,
    hook?: string,
  ): Promise<void>;

  /**
   * Release the page exactly once when capture ends. A rejection propagates unchanged; the caller must handle release failure. The enclosing browser remains caller-owned.
   *
   * @evidence contracts/common.md#principled-implementation Release delegates to the browser driver's page close, the owner API for that handle.
   * @evidence contracts/common.md#clear-and-simple-design No output or options are needed to close this one owned page.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The session neither swallows close failures nor retries teardown.
   * @evidence contracts/common.md#meaningful-documentation States exact-once release, failure propagation and separate browser ownership.
   * @evidence contracts/performance.md#efficient-algorithms The implementation forwards one driver call; browser teardown work belongs to the driver.
   * @evidence contracts/performance.md#reuse-equivalent-work Close is a one-time effect with no reusable result.
   * @evidence contracts/performance.md#bound-retention-and-release-resources This is the session page release point; no browser handle is acquired or released here.
   */
  close(): Promise<void>;
}
