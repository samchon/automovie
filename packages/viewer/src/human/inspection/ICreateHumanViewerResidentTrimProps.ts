import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";
import type { IHumanViewerWorkerHeap } from "./IHumanViewerWorkerHeap.js";

/**
 * What the resident trim reads and acts through.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation Measured page and worker heaps plus per-domain transient samples supply the byte quantities used for resident release.
 * @evidence contracts/common.md#clear-and-simple-design Limit, lower target and measured reserve seeds belong to one trim policy; actual eviction remains with the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the page's non-displayed resident can be evicted through the supplied operation; reserve growth is learned from capture samples.
 *
 * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Measured page and worker heaps plus per-domain transient samples supply the byte quantities used for resident release.
 * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Only the page's non-displayed resident can be evicted through the supplied operation; reserve growth is learned from capture samples.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerResidentTrimProps {
  /**
   * Bytes of JS heap the renderer's isolates together may use before page residents are released.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Carries the configured combined page/worker heap-byte limit consumed by the measured trim policy.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Carries the configured combined page/worker heap-byte limit consumed by the measured trim policy.
   */
  limit: number;

  /**
   * Bytes a trim releases down to, below `limit`, so the next captures find room without collecting again.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Carries the lower byte target that avoids repeated full collection while retaining the displayed resident.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Carries the lower byte target that avoids repeated full collection while retaining the displayed resident.
   */
  target: number;

  /**
   * Read the page isolate's heap, after a full collection when `collect` is set.
   *
   * @evidence contracts/common.md#principled-implementation The current page isolate supplies its own heap accounting, optionally after collection.
   * @evidence contracts/common.md#clear-and-simple-design Page CDP access remains with the reader rather than the trim policy.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed reading is not replaced with an estimated per-model byte count.
   * @evidence contracts/common.md#meaningful-documentation Collect requests garbage collection first; the returned heap values are bytes.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting The current page isolate supplies its own heap accounting, optionally after collection.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Collect requests garbage collection first; the returned heap values are bytes.
   */
  page: (collect: boolean) => Promise<IHumanViewerHeapUsage>;

  /**
   * Read every worker isolate's heap, after a full collection when `collect` is set.
   *
   * @evidence contracts/common.md#principled-implementation Each dedicated worker isolate reports its own heap rather than inheriting page accounting.
   * @evidence contracts/common.md#clear-and-simple-design The heap reader owns worker discovery and sessions; trim only consumes the readings.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing worker reads cannot be fabricated from document population or encoded cache size.
   * @evidence contracts/common.md#meaningful-documentation Collect requests full collection before each worker's byte reading.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Each dedicated worker isolate reports its own heap rather than inheriting page accounting.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Collect requests full collection before each worker's byte reading.
   */
  workers: (collect: boolean) => Promise<IHumanViewerWorkerHeap[]>;

  /**
   * Ask the page to release its least recently used resident other than the one on screen; false when none is left.
   *
   * @evidence contracts/common.md#principled-implementation The page releases its least-recently-used resident other than the displayed one.
   * @evidence contracts/common.md#clear-and-simple-design The cache owns selection and disposal; the trim policy requests one release at a time.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The active display is excluded and elapsed display age is not a release condition.
   * @evidence contracts/common.md#meaningful-documentation False means no non-displayed resident remains available to release.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting The page releases its least-recently-used resident other than the displayed one.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting False means no non-displayed resident remains available to release.
   */
  evict: () => Promise<boolean>;

  /**
   * Start a window of page heap samples taken during one capture.
   *
   * @evidence contracts/common.md#principled-implementation The heap gauge starts a capture's sample window before that capture builds.
   * @evidence contracts/common.md#clear-and-simple-design Window accounting remains with the page's existing gauge.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A reserve is not learned from unrelated samples taken before the marked capture.
   * @evidence contracts/common.md#meaningful-documentation The call establishes the beginning of the capture's transient measurement window.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting The heap gauge starts a capture's sample window before that capture builds.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting The call establishes the beginning of the capture's transient measurement window.
   */
  mark: () => void;

  /**
   * The largest page heap sample since `mark`, or null when none arrived.
   *
   * @evidence contracts/common.md#principled-implementation The gauge returns the largest measured page sample since the capture window opened.
   * @evidence contracts/common.md#clear-and-simple-design One nullable peak feeds reserve learning without exposing sample storage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent samples remain null rather than a zero-byte peak presented as observed.
   * @evidence contracts/common.md#meaningful-documentation The value is page heap bytes; null means the window received no sample.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting The gauge returns the largest measured page sample since the capture window opened.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting The value is page heap bytes; null means the window received no sample.
   */
  windowPeak: () => number | null;

  /**
   * The transient page heap each document domain was measured to need above its starting heap while it builds and draws.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Provides initial per-domain transient byte reserves that the trim owner subsequently increases from actual capture samples.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Provides initial per-domain transient byte reserves that the trim owner subsequently increases from actual capture samples.
   */
  seeds: Record<"face" | "body" | "person", number>;
}
