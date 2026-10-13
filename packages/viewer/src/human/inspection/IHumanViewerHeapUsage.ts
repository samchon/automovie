/**
 * One reading of the resident page's JavaScript heap, as the renderer's own
 * V8 isolate reports it through `Runtime.getHeapUsage`. The page and its
 * same-origin viewport iframes share that isolate, so the reading covers every
 * resident model, witness and cache string the viewer holds.
 *
 * @evidence contracts/common.md#principled-implementation Reads the isolate's own accounting instead of estimating sizes from document counts.
 * @evidence contracts/common.md#meaningful-documentation States which isolate is measured and what it includes.
 *
 * @evidence contracts/common.md#clear-and-simple-design Used and reserved byte counts mirror the two V8 heap quantities without estimating per-model costs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The values are renderer-isolate accounting, not document-count multipliers or encoded-file sizes.
 *
 * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Reads the isolate's own accounting instead of estimating sizes from document counts.
 * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting The values are renderer-isolate accounting, not document-count multipliers or encoded-file sizes.
 *
 * @author Samchon
 */
export interface IHumanViewerHeapUsage {
  /**
   * Bytes of live and not yet collected objects in the heap.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Reports the isolate's live and not-yet-collected heap bytes rather than typed-array model estimates.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Reports the isolate's live and not-yet-collected heap bytes rather than typed-array model estimates.
   */
  usedSize: number;

  /**
   * Bytes the heap has reserved from the system.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Reports heap bytes reserved from the system separately from the used-byte reading.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Reports heap bytes reserved from the system separately from the used-byte reading.
   */
  totalSize: number;
}
