/**
 * One admitted reporting scope, shared by scene, checkpoint and camera owners.
 * This internal record is an ownership token, never an input/debug option.
 */
export interface IAutoMovieRecoveryFeasibleReportCapacity {
  /** Numerical scene capacity after the scope's entire report reservation. */
  readonly sceneEntries: number;

  /** Numerical fit capacity after both original fit and scene ceilings. */
  readonly fitEntries: number;

  /** Fixed logical scalar/reference slots reserved once under the scene limit. */
  readonly reservedEntries: number;
}
