import type {
  IAutoMovieRecoveryFeasibleFit,
  IAutoMovieRecoveryRegularizationUpdate,
} from "@automovie/recovery";

/** Source fit effects for one independently prescribed quadratic halfspace. */
export interface IRecoveryRegularizationObservation {
  /** Original generic fit, including physical normal and actual-trial counts. */
  fit: IAutoMovieRecoveryFeasibleFit<number[]>;

  /** Coefficient used by each existing model, including the terminal model. */
  damping: number[];

  /** Actual selected-increment reactions, without retained geometry. */
  reactions: IAutoMovieRecoveryRegularizationUpdate[];

  /** Conservative owner, direction, selection and reaction charges. */
  work: number;

  /** Actual trial checkpoints, including qualified-unselected evaluations. */
  checkpoints: number;

  /** Number of completely evaluated original objectives, including the initial state. */
  evaluations: number;
}
