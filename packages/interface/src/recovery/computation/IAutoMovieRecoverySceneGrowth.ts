import type { IAutoMovieRecoveryMapLandmark } from "../../index";

/** Detached point/measurement growth proposal before joint acceptance. */
export interface IAutoMovieRecoverySceneGrowth {
  /** Complete detached proposed landmark population. */
  landmarks: IAutoMovieRecoveryMapLandmark[];

  /** Strict count increase in proposed points. */
  addedLandmarks: number;

  /**
   * Strict count increase in retained measurements, including new-point
   * observations.
   */
  addedObservations: number;
}
