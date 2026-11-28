import type { IAutoMovieRecoveryMapObservation } from "..";

/**
 * A sparse fitting point in the first-camera coordinate system and its retained
 * image measurements. The length unit is the seed baseline.
 */
export interface IAutoMovieRecoveryMapLandmark {
  /**
   * Numeric component identity assigned by feature linkage for this observation
   * set.
   */
  id: number;

  /**
   * Reconstructed [X, Y, Z] in the first-camera frame, measured in
   * seed-baseline units.
   */
  point: [number, number, number];

  /**
   * Image measurements retained for this point, one per view in the enclosing
   * camera population.
   */
  observations: IAutoMovieRecoveryMapObservation[];
}
