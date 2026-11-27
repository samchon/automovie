import type {
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoveryMapState,
} from "..";

/** Owned numerical state and explicit fixed-population joint termination. */
export interface IAutoMovieRecoveryMapJointResult extends IAutoMovieRecoveryMapState {
  /** Actual numerical termination over the same ordered observations. */
  report: IAutoMovieRecoveryMapJointFit;
}
