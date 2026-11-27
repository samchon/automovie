import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneTriangulation,
} from "..";

/**
 * Triangulate one new track using only already registered camera observations.
 * The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;
 * its finite point remains in the common seed gauge, not a new pair unit
 * gauge.
 */

export namespace IAutoMovieRecoverySceneTrackTriangulationOperation {
  /**
   * Triangulate one new track using only already registered camera
   * observations. The original 2k-by-4 homogeneous design uses calibrated
   * world-to-camera rows; its finite point remains in the common seed gauge,
   * not a new pair unit gauge.
   */

  export type Operation = (
    observations: readonly IAutoMovieRecoveryMapObservation[],
    poses: readonly (IAutoMovieRecoveryMapPose | null)[],
    charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
    budget: IAutoMovieRecoveryCameraMapBudget,
  ) => IAutoMovieRecoverySceneTriangulation;
}
