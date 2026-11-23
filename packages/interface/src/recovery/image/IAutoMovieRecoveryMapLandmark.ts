import type { IAutoMovieRecoveryMapObservation } from "../../index";

/** Sparse conditional fitting evidence, not an authored surface or metric point. */
export interface IAutoMovieRecoveryMapLandmark {
  /** Deterministic linked-feature component identity within this operation. */
  id: number;

  /** World coordinate in first-camera axes and unit seed-baseline length. */
  point: [number, number, number];

  /**
   * Distinct-view observations retained by explicit geometry gates; absent
   * images remain unobserved.
   */
  observations: IAutoMovieRecoveryMapObservation[];
}
