import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryFeasibleReportCapacity,
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneCheckpoint,
  IAutoMovieRecoverySceneCheckpointTrace,
  IAutoMovieRecoverySceneWork,
} from "../../index";

/**
 * Complete a detached scene transaction through growth and full joint geometry.
 * After each fit, newly admissible points/measurements cause another fit. Only
 * strict finite population growth repeats; every fit and linear action is
 * charged. Failure leaves committing or retaining the old checkpoint to caller.
 * An optional observer receives owned complete compact states before and after
 * each joint fit. Observer errors propagate, and ordinary calls retain no
 * trace.
 */

export namespace IAutoMovieRecoverySceneCheckpointCompletionOperation {
  /**
   * Complete a detached scene transaction through growth and full joint
   * geometry. After each fit, newly admissible points/measurements cause
   * another fit. Only strict finite population growth repeats; every fit and
   * linear action is charged. Failure leaves committing or retaining the old
   * checkpoint to caller. An optional observer receives owned complete compact
   * states before and after each joint fit. Observer errors propagate, and
   * ordinary calls retain no trace.
   */

  export type Operation = (
    initialPoses: readonly (IAutoMovieRecoveryMapPose | null)[],
    initialLandmarks: readonly IAutoMovieRecoveryMapLandmark[],
    tracks: ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>["tracks"],
    charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
    budget: IAutoMovieRecoveryCameraSceneBudget,
    work: IAutoMovieRecoverySceneWork,
    checkpoint: () => void,
    onProposal?: (
      points: number,
      observations: number,
      report: IAutoMovieRecoveryMapJointFit | null,
    ) => void,
    onTrace?: (trace: IAutoMovieRecoverySceneCheckpointTrace) => void,
    feasible?: IAutoMovieRecoveryFeasibleJointOptions,
    reportCapacity?: IAutoMovieRecoveryFeasibleReportCapacity,
  ) => IAutoMovieRecoverySceneCheckpoint;
}
