/**
 * Millisecond durations measured at the server and GPU page boundaries of one
 * capture. Each process subtracts its own monotonic performance clock values;
 * absolute timestamps from different processes are never subtracted together.
 * Missing fields describe stages this observation did not record.
 *
 * @evidence contracts/common.md#principled-implementation Optional durations distinguish measured stages without inventing timings for stages not observed.
 * @evidence contracts/common.md#clear-and-simple-design One record carries the capture pipeline stages reported by health and request telemetry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fields contain actual stage durations rather than document-specific estimates.
 * @evidence contracts/common.md#meaningful-documentation States milliseconds, independent monotonic clocks and omitted-stage meaning.
 * @author Samchon
 */
export interface IHumanViewerPhases {
  /** Waiting behind other capture requests. */
  queueMs?: number;

  /** Waiting for transformed GPU page modules. */
  pageWaitMs?: number;

  /** Numerical build and drawing in the page. */
  showMs?: number;

  /** Numerical worker time, zero for a cached model. */
  buildMs?: number;

  /** Canvas encoding to a PNG data URL. */
  pngMs?: number;

  /** Decoding the data URL in the server. */
  decodeMs?: number;

  /** Writing the HTTP response. */
  responseMs?: number;

  /** Request receipt through response completion. */
  totalMs?: number;
}
