import type { IAutoMovieRecoveryMapLandmark } from "..";

/**
 * Detached increase proposal for the scene's point and observation population.
 * A zero increase in both counts closes the current population.
 */
export interface IAutoMovieRecoverySceneGrowth {
  /**
   * Complete detached landmark population proposed for the next joint
   * evaluation.
   */
  landmarks: IAutoMovieRecoveryMapLandmark[];

  /** Number of newly admitted point tracks, possibly zero. */
  addedLandmarks: number;

  /**
   * Number of new retained measurements, including those attached to new
   * points, possibly zero.
   */
  addedObservations: number;
}
