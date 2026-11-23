import type { IAutoMovieIKPole } from "./IAutoMovieIKPole";

/**
 * Inverse kinematics: back-solve a bone chain so its tip reaches a goal.
 *
 * Resolved in the world-space pass on composed positions. twoBone handles
 * exactly three nodes analytically and otherwise remains deferred; CCD/FABRIK
 * require at least two nodes and ignore pole. Positions and segment-alignment
 * rotations blend by influence before the tip subtree recomposes.
 * Segment-length preservation at full influence assumes representable geometry
 * and a nonempty analytic reach shell; partial influence does not preserve
 * lengths in general. These solvers impose no anatomical ROM and do not certify
 * convergence or every derived result's finiteness.
 */
export interface IAutoMovieIKDriver {
  /** Discriminator. */
  type: "ik";

  /** Bone chain node ids, root to tip. */
  chain: string[];

  /** Node whose world position the chain tip reaches for. */
  goal: string;

  /** Bend-plane control read only by `twoBone`, or `null`. */
  pole: IAutoMovieIKPole | null;

  /**
   * Solver: twoBone is analytic for three nodes; CCD and FABRIK are iterative
   * and admit chains of at least two nodes.
   */
  solver: "twoBone" | "ccd" | "fabrik";

  /**
   * Positive safe-integer iteration cap for CCD/FABRIK, with early exit within
   * 1e-6 m of the goal; null uses 10. twoBone ignores this field. The cap
   * bounds iterations, not a promise of convergence or fixed elapsed time.
   */
  iterations: number | null;

  /** Blend factor `[0, 1]` between the composed pose and the solved one. */
  influence: number;
}
