import type { IAutoMovieRecoveryMapObservation } from "..";

/**
 * One existing checkpoint landmark paired with a target-view measurement from
 * the same linked track.
 */
export interface IAutoMovieRecoverySceneCandidate {
  /** Index into the accepted landmark array for the current checkpoint revision. */
  landmark: number;

  /**
   * Target camera source index, feature index, and observed two-coordinate
   * pixel in the linked track.
   */
  observation: IAutoMovieRecoveryMapObservation;
}
