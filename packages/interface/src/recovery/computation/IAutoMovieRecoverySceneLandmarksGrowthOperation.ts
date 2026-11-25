import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryCameraSceneBudget,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneGrowth,
  IAutoMovieRecoverySceneWork,
} from "../../index";

/**
 * Propose point and measurement growth using only currently registered poses.
 * Existing points receive only individually positive-depth pixel-qualified
 * measurements; new points must pass every available registered observation.
 */

export namespace IAutoMovieRecoverySceneLandmarksGrowthOperation {
  /**
   * Propose point and measurement growth using only currently registered poses.
   * Existing points receive only individually positive-depth pixel-qualified
   * measurements; new points must pass every available registered observation.
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
