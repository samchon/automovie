import type { IHumanViewerHeapPeak } from "./IHumanViewerHeapPeak.js";
import type { IHumanViewerHeapUsage } from "./IHumanViewerHeapUsage.js";

/**
 * What `/health` reports about the resident page's JavaScript heap: the last
 * reading, the peak since the server started and how many readings were
 * taken. Readings are taken at each work-stage transition the page reports,
 * so a transient allocation inside one stage can exceed the recorded peak.
 *
 * @evidence contracts/common.md#principled-implementation Reports measured heap use beside the work stage instead of inferring memory from counts.
 * @evidence contracts/common.md#meaningful-documentation States when readings are taken and what they can miss.
 *
 * @evidence contracts/common.md#clear-and-simple-design Last reading, peak, sample count and unavailable cause express measured heap telemetry and its gaps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or failed reads remain null with their cause rather than becoming zero-byte success.
 *
 * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Reports measured heap use beside the work stage instead of inferring memory from counts.
 * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Missing or failed reads remain null with their cause rather than becoming zero-byte success.
 *
 * @author Samchon
 */
export interface IHumanViewerHeap {
  /**
   * The most recent reading, or null before the first.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Keeps the latest actual isolate byte reading nullable before any successful sample.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Keeps the latest actual isolate byte reading nullable before any successful sample.
   */
  last: IHumanViewerHeapUsage | null;

  /**
   * The largest reading so far, or null before the first.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Preserves the largest observed sample and its work/source context without claiming unseen intra-stage peaks.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Preserves the largest observed sample and its work/source context without claiming unseen intra-stage peaks.
   */
  peak: IHumanViewerHeapPeak | null;

  /**
   * Readings taken since the server started.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Counts actually taken heap readings rather than elapsed observation opportunities.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Counts actually taken heap readings rather than elapsed observation opportunities.
   */
  samples: number;

  /**
   * Why the most recent reading failed, or null when it succeeded or none was tried.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Preserves a failed reader's cause instead of reporting a fabricated zero-byte measurement.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Preserves a failed reader's cause instead of reporting a fabricated zero-byte measurement.
   */
  unavailable: string | null;
}
