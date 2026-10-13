import { IAutoMovieIKPole } from "./IAutoMovieIKPole";

/** Inverse kinematics: back-solve a bone chain so its tip reaches a goal. */
export interface IAutoMovieIKDriver {
  /** Discriminator. */
  type: "ik";

  /** Bone chain, root → tip. */
  chain: string[];

  /** Node the chain tip reaches for. */
  goal: string;

  /** Pole/twist control for the solve plane, or `null`. */
  pole: IAutoMovieIKPole | null;

  /**
   * Solver. `twoBone` is the analytic, deterministic limb solver (build-first);
   * `ccd`/`fabrik` are iterative, for longer chains.
   */
  solver: "twoBone" | "ccd" | "fabrik";

  /**
   * Iteration cap for iterative solvers (fixed for determinism); `null` for
   * `twoBone`.
   */
  iterations: number | null;

  /** Blend factor `[0, 1]`. */
  influence: number;
}
