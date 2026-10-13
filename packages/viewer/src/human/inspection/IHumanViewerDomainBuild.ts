/**
 * The last numerical build of one domain.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the document and duration.
 *
 * @evidence contracts/common.md#principled-implementation A domain's last completed numerical build is represented by its actual document id and worker duration.
 * @evidence contracts/common.md#clear-and-simple-design Document and milliseconds are the only fields needed for the per-domain latest-build query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The duration is reported by a completed worker build, never invented from a display cache hit.
 *
 * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting A domain's last completed numerical build is represented by its actual document id and worker duration.
 * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting The duration is reported by a completed worker build, never invented from a display cache hit.
 *
 * @author Samchon
 */
export interface IHumanViewerDomainBuild {
  /**
   * Document built.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Identifies the actual document that produced this domain's last numerical build.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Identifies the actual document that produced this domain's last numerical build.
   */
  doc: string;

  /**
   * Worker milliseconds of the build.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Preserves that build's worker milliseconds separately from its later display or cache lookup.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Preserves that build's worker milliseconds separately from its later display or cache lookup.
   */
  ms: number;
}
