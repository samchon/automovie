import type { IAutoMovieRecoveryMapObservation } from "..";

/** Distinct existing landmark and one target-image measurement. */
export interface IAutoMovieRecoverySceneCandidate {
  /** Index in the accepted landmark array for this revision. */
  landmark: number;

  /** Fixed target measurement from the same global component. */
  observation: IAutoMovieRecoveryMapObservation;
}
