import type { IAutoMovieRecoverySceneCandidate } from "..";

/**
 * One pending camera and its available existing-map support at the current
 * accepted revision.
 */
export interface IAutoMovieRecoverySceneQueue {
  /** Original input index of the pending camera. */
  view: number;

  /**
   * Distinct pairs of accepted landmark indices and target measurements offered
   * to resection.
   */
  candidates: IAutoMovieRecoverySceneCandidate[];
}
