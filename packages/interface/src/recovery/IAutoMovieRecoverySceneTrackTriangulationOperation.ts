import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoverySceneTriangulation,
} from "..";

/**
 * Callable calibrated track triangulation in the scene's current
 * unit-seed-baseline gauge.
 */

export namespace IAutoMovieRecoverySceneTrackTriangulationOperation {
  /**
   * Use at least two distinct registered observations and their supplied
   * inverse charts to form a two-row-per-view, four-column homogeneous design.
   * Check its work and rank limits, then qualify the resulting point against
   * all retained projections. A recognized design or geometry refusal returns a
   * null candidate with reasons.
   */

  export type Operation = (
    observations: readonly IAutoMovieRecoveryMapObservation[],
    poses: readonly (IAutoMovieRecoveryMapPose | null)[],
    charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
    budget: IAutoMovieRecoveryCameraMapBudget,
  ) => IAutoMovieRecoverySceneTriangulation;
}
