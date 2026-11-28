import type { IAutoMovieRecoveryMapObservation } from "..";

/** One nonconflicting connected component of reciprocal appearance measurements. */
export interface IAutoMovieRecoveryLinkedTrack {
  /** Stable component identity in the current feature linkage. */
  id: number;

  /** Original pixel observations in the component, with distinct source views. */
  observations: IAutoMovieRecoveryMapObservation[];
}
