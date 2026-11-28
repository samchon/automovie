import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneGrowth,
  IAutoMovieRecoverySceneWork,
} from "..";

/**
 * Callable construction of a detached point and measurement proposal using
 * currently registered cameras.
 */

export namespace IAutoMovieRecoverySceneLandmarksGrowthOperation {
  /**
   * Copy the retained points, then add missing observations with positive depth
   * and acceptable pixel residual. Triangulate new tracks from their registered
   * observations and retain each point only when all those views qualify.
   * Charge shared scene work, and check retention before growing the proposal.
   */

  export type Operation = (
    tracks: ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>["tracks"],
    initial: readonly IAutoMovieRecoveryMapLandmark[],
    poses: readonly (IAutoMovieRecoveryMapPose | null)[],
    charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
    budget: IAutoMovieRecoveryCameraSceneBudget,
    work: IAutoMovieRecoverySceneWork,
    checkpoint: () => void,
  ) => IAutoMovieRecoverySceneGrowth;
}
