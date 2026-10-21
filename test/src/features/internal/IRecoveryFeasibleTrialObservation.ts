import type { IAutoMovieRecoveryFeasibleTrialSelection } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleTrialSelection";
import type { IAutoMovieRecoveryFeasibleTrials } from "../../../../packages/recovery/src/structures/internal/IAutoMovieRecoveryFeasibleTrials";

/** Actual same-base selector effects observed by an independent scalar case. */
export interface IRecoveryFeasibleTrialObservation {
  /** One selected or explicitly unaccepted state from the source selector. */
  selected: IAutoMovieRecoveryFeasibleTrialSelection<number>;

  /** Mutually exclusive actual paths and outcomes. */
  trials: IAutoMovieRecoveryFeasibleTrials;

  /** Actual evaluated states, including failures and qualified unselected ones. */
  states: number[];

  /** Checkpoints reached immediately before actual evaluations. */
  checkpoints: number;

  /** Source work charges, without measuring host latency. */
  work: number;

  /** Actual requests to the one-use authored curvature action. */
  corrections: number;

  /** Exact arrays borrowed by retractions, retained only by this bounded resident test. */
  increments: (readonly number[])[];

  /** Original baseline and accelerated input directions stayed unchanged. */
  directionsUnchanged: boolean;
}
