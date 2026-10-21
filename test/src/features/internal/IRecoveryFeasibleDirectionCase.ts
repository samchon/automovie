import type { IAutoMovieSimplexAtom } from "../../../../packages/engine/src/math/IAutoMovieSimplexAtom";

/** Authored pure-QP rows and an independently derived physical optimum. */
export interface IRecoveryFeasibleDirectionCase {
  /** Euclidean direction dimension excluding the auxiliary gamma. */
  width: number;

  /** Objective first, then every unweighted normalized constraint. */
  rows: IAutoMovieSimplexAtom[];

  /** Closed-form physical step, independent of either numerical solver. */
  expected: number[];

  /** Closed-form shared tilt at that optimum. */
  gamma: number;
}
