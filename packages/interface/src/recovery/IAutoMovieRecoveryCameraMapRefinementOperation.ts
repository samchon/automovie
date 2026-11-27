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
 * Joint sparse-map refinement retains the fixed observation population and
 * gauge. Coordinates use the initial reconstruction scale, with supplied pixel
 * intrinsics. Checkpoints and work charges run synchronously; either callback
 * may throw to terminate without a result. Omitted charge performs no
 * accounting callback, and omitted feasible options retain ordinary refinement.
 * With feasible refinement, reportCapacity borrows an already admitted
 * reporting scope; omission admits the direct reporting envelope, while
 * ordinary refinement ignores it. Numerical rank, depth, pixel residual and
 * budget admission remain the recovery solver's responsibility.
 */
export namespace IAutoMovieRecoveryCameraMapRefinementOperation {
  /**
   * Joint sparse-map refinement retains the fixed observation population and
   * gauge. Coordinates use the initial reconstruction scale, with supplied
   * pixel intrinsics. Checkpoints and work charges run synchronously; either
   * callback may throw to terminate without a result. Omitted charge performs
   * no accounting callback, and omitted feasible options retain ordinary
   * refinement. With feasible refinement, reportCapacity borrows an already
   * admitted reporting scope; omission admits the direct reporting envelope,
   * while ordinary refinement ignores it. Numerical rank, depth, pixel residual
   * and budget admission remain the recovery solver's responsibility.
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
