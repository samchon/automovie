/**
 * Millisecond durations measured at the server and GPU page boundaries of one capture. Each process subtracts its own monotonic performance clock values; absolute timestamps from different processes are never subtracted together. Missing fields describe stages this observation did not record.
 *
 * @evidence contracts/common.md#principled-implementation Reports independently measured server/page/worker durations for one capture, subtracting only same-clock timestamp pairs.
 * @evidence contracts/common.md#clear-and-simple-design Keeps HTTP total/queue, page show/PNG and numerical reply timing separate rather than summing overlapping boundaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named spans can overlap when callers nest/concurrently measure stages; otherMs clamps the residual and is not proof of complete nonoverlapping attribution.
 * @evidence contracts/common.md#meaningful-documentation Documents milliseconds, omitted unobserved fields and server/page scope; spans may sum repeated stage executions without a planned denominator.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no timing; span snapshots copy recorded names and capture projection reduces their durations once.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated names accumulate distinct measurements, while reset starts one capture's record; prior durations cannot substitute for new observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One capture record retains numeric fields and arbitrary named spans until replacement, without a stage-name cap or runtime handle.
 *
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

  /**
   * Page milliseconds summed by stage name, including loading, cache read/decode, numerical work, preparation and drawing. Nested or concurrent measurements can overlap; their sum is not necessarily a partition of showMs.
   */
  spans?: Record<string, number>;

  /** max(0, showMs minus the sum of spans); this residual is not proof of nonoverlapping attribution. */
  otherMs?: number;

  /** Canvas encoding to a PNG data URL. */
  pngMs?: number;

  /** Decoding the data URL in the server. */
  decodeMs?: number;

  /** Writing the HTTP response. */
  responseMs?: number;

  /** Request receipt through response completion. */
  totalMs?: number;
}
