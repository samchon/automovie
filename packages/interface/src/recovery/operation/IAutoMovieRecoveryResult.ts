import type {
  IAutoMovieRecoveryCompleted,
  IAutoMovieRecoveryTerminated,
} from "../../index";

/** Discriminated outcome; only a completed or partial operation carries a value. */

export type IAutoMovieRecoveryResult<T> =
  | IAutoMovieRecoveryCompleted<T>
  | IAutoMovieRecoveryTerminated;
