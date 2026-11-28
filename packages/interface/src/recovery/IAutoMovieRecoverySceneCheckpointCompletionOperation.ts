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
} from "..";

/**
 * Callable detached scene-checkpoint completion, with optional snapshots around
 * each numerical fit.
 */

export namespace IAutoMovieRecoverySceneCheckpointCompletionOperation {
  /**
   * With the original seed poses active, grow candidate support and refine
   * compact poses and points in the common gauge. Repeat a fit only after a
   * qualified population gains points or observations. Charge the shared work
   * ledger before fitted work. The optional proposal callback receives counts
   * and the available fit report, and the optional trace receives owned before-
   * and after-fit states.
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
