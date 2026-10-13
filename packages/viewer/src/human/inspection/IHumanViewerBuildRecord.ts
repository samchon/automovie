/**
 * One numerical build the server saw, kept by document so a saving can be measured.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the build duration, occlusion and time.
 *
 * @evidence contracts/common.md#principled-implementation Duration, AO choice and observation time record an actual numerical build rather than a cache-hit estimate.
 * @evidence contracts/common.md#clear-and-simple-design The per-document record contains only the completed build's timing context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed build milliseconds are supplied by worker telemetry and cannot be inferred from a viewer readiness flag.
 *
 * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Duration, AO choice and observation time record an actual numerical build rather than a cache-hit estimate.
 * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Elapsed build milliseconds are supplied by worker telemetry and cannot be inferred from a viewer readiness flag.
 *
 * @author Samchon
 */
export interface IHumanViewerBuildRecord {
  /**
   * Worker milliseconds of the build.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Records the completed worker's numerical milliseconds separately from GPU display and queue waiting time.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Records the completed worker's numerical milliseconds separately from GPU display and queue waiting time.
   */
  ms: number;

  /**
   * Whether ambient occlusion was baked.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Preserves whether this actual Face build evaluated ambient occlusion.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Preserves whether this actual Face build evaluated ambient occlusion.
   */
  ao: boolean;

  /**
   * ISO time of the build.
   *
   * @evidence requirements/operations-and-recovery/resource-budgets-and-backpressure.md#operations-budget-result-accounting Locates the completed build observation in wall-clock time without using that time as model identity.
   * @evidence specifications/execution-and-recovery/resource-budgets-and-backpressure.md#execution-resource-accounting Locates the completed build observation in wall-clock time without using that time as model identity.
   */
  at: string;
}
