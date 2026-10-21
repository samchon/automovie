/**
 * One admitted reporting scope, shared by scene, checkpoint and camera owners.
 * This internal record is an ownership token, never an input/debug option.
 *
 * @evidence contracts/common.md#principled-implementation Original ceilings are partitioned between fixed report retention and numerical execution without increasing either declared limit.
 * @evidence contracts/common.md#clear-and-simple-design A three-scalar context is acquired once per outer scope and borrowed by nested owners instead of reserving the same report population again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No input flag, alternate numerical method, caller report history or successful fallback supplies capacity.
 * @evidence contracts/common.md#meaningful-documentation Scene entries govern growth/resection/checkpoint work; fit entries can be narrower and are tested after original configuration/gauge admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three scalar fields belong to the current reporting envelope; the scope is borrowed synchronously and never enters returned reports.
 */
export interface IAutoMovieRecoveryFeasibleReportCapacity {
  /** Numerical scene capacity after the scope's entire report reservation. */
  readonly sceneEntries: number;

  /** Numerical fit capacity after both original fit and scene ceilings. */
  readonly fitEntries: number;

  /** Fixed logical scalar/reference slots reserved once under the scene limit. */
  readonly reservedEntries: number;
}
