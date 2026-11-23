import type { IAutoMovieRecoveryFeasibleDirection } from "../../index";

/** Scalar termination evidence for the most recent feasible-direction model. */
export interface IAutoMovieRecoveryFeasibleDirectionReport extends Omit<
  IAutoMovieRecoveryFeasibleDirection,
  "step" | "multipliers"
> {}
