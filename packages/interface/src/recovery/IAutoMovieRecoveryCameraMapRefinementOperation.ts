import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryFeasibleReportCapacity,
  IAutoMovieRecoveryMapJointResult,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
} from "..";

/**
 * Callable contract for joint recovery-map refinement over a fixed set of
 * admitted observations and a fixed similarity gauge.
 */
export namespace IAutoMovieRecoveryCameraMapRefinementOperation {
  /**
   * Refine poses and points in the initial reconstruction scale using supplied
   * intrinsics, the fixed first pose, and the unit seed baseline. Checkpoint
   * and work-charge callbacks run synchronously and may interrupt by throwing.
   * Omit `feasible` for ordinary refinement. When feasible refinement is
   * selected, `reportCapacity` can supply an admitted reporting scope; omission
   * admits direct report capacity.
   */
  export type Operation = (
    initialPoses: readonly IAutoMovieRecoveryMapPose[],
    initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[],
    intrinsics: readonly (readonly number[])[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
    budget: IAutoMovieRecoveryCameraMapBudget,
    checkpoint: () => void,
    charge?: (work: number) => void,
    feasible?: IAutoMovieRecoveryFeasibleJointOptions,
    reportCapacity?: IAutoMovieRecoveryFeasibleReportCapacity,
  ) => IAutoMovieRecoveryMapJointResult;
}
