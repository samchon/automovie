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
 * Propose point and measurement growth using only currently registered poses. Existing points receive only individually positive-depth pixel-qualified measurements; new points must pass every available registered observation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Propose point and measurement growth using only currently registered poses. Existing points receive only individually positive-depth pixel-qualified
 * @evidence contracts/development/design.md#principled-representation Propose point and measurement growth using only currently registered poses. Existing points receive only individually positive-depth pixel-qualified
 * @evidence contracts/development/design.md#minimal-and-owned-surface completeRecoverySceneCheckpoint, growRecoverySceneLandmarks share IAutoMovieRecoverySceneLandmarksGrowthOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoverySceneLandmarksGrowthOperation {
  /**
   * Propose point and measurement growth using only currently registered poses. Existing points receive only individually positive-depth pixel-qualified measurements; new points must pass every available registered observation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Propose point and measurement growth using only currently registered poses. Existing points receive only individually positive-depth pixel-qualified
   * @evidence contracts/development/design.md#principled-representation Propose point and measurement growth using only currently registered poses. Existing points receive only individually positive-depth pixel-qualified
   * @evidence contracts/development/design.md#minimal-and-owned-surface completeRecoverySceneCheckpoint, growRecoverySceneLandmarks share IAutoMovieRecoverySceneLandmarksGrowthOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
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
