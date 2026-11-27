import type {
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
} from "..";

/** Detached fixed-population state owned by one joint map fit. */
export interface IAutoMovieRecoveryMapState {
  /**
   * Registered cameras in compact source order, first identity and seed norm
   * one.
   */
  poses: IAutoMovieRecoveryMapPose[];

  /**
   * Ordered points with every retained measurement in that same compact view
   * chart.
   */
  landmarks: IAutoMovieRecoveryMapLandmark[];
}
