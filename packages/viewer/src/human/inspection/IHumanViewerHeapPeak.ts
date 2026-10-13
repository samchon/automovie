/**
 * The largest heap reading of the resident page since the server started,
 * with the work stage that produced it, so a memory peak can be traced to the
 * document and generation that caused it.
 *
 * @evidence contracts/common.md#principled-implementation Ties each peak to the stage and source generation it was read at.
 * @evidence contracts/common.md#meaningful-documentation Names every field a memory investigation needs.
 *
 * @evidence contracts/common.md#clear-and-simple-design One byte peak keeps its source, document, phase and time beside the observed amount.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record cannot certify unseen intra-stage memory peaks; it stores the stage sample the owner actually read.
 *
 * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Ties each peak to the stage and source generation it was read at.
 * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting The record cannot certify unseen intra-stage memory peaks; it stores the stage sample the owner actually read.
 *
 * @author Samchon
 */
export interface IHumanViewerHeapPeak {
  /**
   * Bytes in use at the peak.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Carries V8's measured used-heap bytes at the actual sampled peak.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Carries V8's measured used-heap bytes at the actual sampled peak.
   */
  usedSize: number;

  /**
   * Source generation the page had loaded.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Associates the sampled peak with the source generation loaded by that page.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Associates the sampled peak with the source generation loaded by that page.
   */
  revision: string;

  /**
   * Document the page was working on.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Identifies the document whose work accompanied the largest observed heap reading.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Identifies the document whose work accompanied the largest observed heap reading.
   */
  doc: string;

  /**
   * Work stage reported just before the reading.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Retains the actual work phase reported before the peak sample.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Retains the actual work phase reported before the peak sample.
   */
  phase: string;

  /**
   * ISO time of the reading.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Locates the actual measurement in wall time without treating its age as a memory limit.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Locates the actual measurement in wall time without treating its age as a memory limit.
   */
  at: string;
}
