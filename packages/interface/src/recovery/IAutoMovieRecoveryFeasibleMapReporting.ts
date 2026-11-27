import type {
  IAutoMovieRecoveryFeasibleMapWork,
  IAutoMovieRecoveryFeasibleReportCapacity,
} from "..";

/** Admitted numerical work and the borrowed reporting scope for one map fit. */
export interface IAutoMovieRecoveryFeasibleMapReporting extends IAutoMovieRecoveryFeasibleMapWork {
  /** Shared admitted capacities; nested owners do not reserve them again. */
  reporting: IAutoMovieRecoveryFeasibleReportCapacity;
}
