/**
 * One admitted reporting scope, shared by scene, checkpoint and camera owners.
 * This internal record is an ownership token, never an input/debug option.
 *
 * @evidence contracts/development/design.md#principled-representation Original ceilings are partitioned between fixed report retention and numerical execution without increasing either declared limit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A three-scalar context is acquired once per outer scope and borrowed by nested owners instead of reserving the same report population again.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No input flag, alternate numerical method, caller report history or successful fallback supplies capacity.
 * @evidence contracts/development/common.md#meaningful-documentation Scene entries govern growth/resection/checkpoint work; fit entries can be narrower and are tested after original configuration/gauge admission.
 */
export interface IAutoMovieRecoveryFeasibleReportCapacity {
  /** Numerical scene capacity after the scope's entire report reservation. */
  readonly sceneEntries: number;

  /** Numerical fit capacity after both original fit and scene ceilings. */
  readonly fitEntries: number;

  /** Fixed logical scalar/reference slots reserved once under the scene limit. */
  readonly reservedEntries: number;
}
