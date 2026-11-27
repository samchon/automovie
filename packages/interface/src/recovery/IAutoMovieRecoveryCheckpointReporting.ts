import type {
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryFeasibleReportCapacity,
} from "..";

/** One direct checkpoint's owned method and matching reporting capacity. */
export interface IAutoMovieRecoveryCheckpointReporting {
  /** Fixed owned method, including the independent nested direction budget. */
  feasible: IAutoMovieRecoveryFeasibleJointOptions;

  /** Scope derived from that same owned request before any checkpoint callback. */
  reporting: IAutoMovieRecoveryFeasibleReportCapacity;
}
