import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneTriangulation,
} from "../../index";

/**
 * Triangulate one new track using only already registered camera observations. The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows; its finite point remains in the common seed gauge, not a new pair unit gauge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Triangulate one new track using only already registered camera observations. The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;
 * @evidence contracts/development/design.md#principled-representation Triangulate one new track using only already registered camera observations. The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;
 * @evidence contracts/development/design.md#minimal-and-owned-surface growRecoverySceneLandmarks, triangulateRecoverySceneTrack share IAutoMovieRecoverySceneTrackTriangulationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoverySceneTrackTriangulationOperation {
  /**
   * Triangulate one new track using only already registered camera observations. The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows; its finite point remains in the common seed gauge, not a new pair unit gauge.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Triangulate one new track using only already registered camera observations. The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;
   * @evidence contracts/development/design.md#principled-representation Triangulate one new track using only already registered camera observations. The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;
   * @evidence contracts/development/design.md#minimal-and-owned-surface growRecoverySceneLandmarks, triangulateRecoverySceneTrack share IAutoMovieRecoverySceneTrackTriangulationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    observations: readonly IAutoMovieRecoveryMapObservation[],
    poses: readonly (IAutoMovieRecoveryMapPose | null)[],
    charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
    budget: IAutoMovieRecoveryCameraMapBudget,
  ) => IAutoMovieRecoverySceneTriangulation;
}
