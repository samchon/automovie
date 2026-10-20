import { IAutoMovieIKPole } from "./IAutoMovieIKPole";

/**
 * Inverse kinematics: back-solve a bone chain so its tip reaches a goal.
 *
 * Resolved in the world-space pass on composed positions. twoBone handles exactly three nodes analytically and otherwise remains deferred; CCD/FABRIK require at least two nodes and ignore pole. Positions and segment-alignment rotations blend by influence before the tip subtree recomposes. Segment-length preservation at full influence assumes representable geometry and a nonempty analytic reach shell; partial influence does not preserve lengths in general. These solvers impose no anatomical ROM and do not certify convergence or every derived result's finiteness.
 *
 * @evidence contracts/common.md#principled-implementation `twoBone` places the middle joint by the law of cosines over the two bone lengths and the reach clamped to `[|l1 - l2| + 1e-5, l1 + l2 - 1e-5]`; `ccd` sweeps joints tip to root rotating the tip toward the goal, and `fabrik` runs backward and forward passes at fixed segment lengths, both stopping at the iteration cap or within `1e-6` m.
 * @evidence contracts/common.md#clear-and-simple-design One driver type selects among three solvers by a tag, sharing the chain, goal, influence and the rotation write-back, with the pole and iteration fields read only by the solvers that need them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Iterative solves use positive safe-integer budgets, not a wall-clock cutoff, and unsupported twoBone chain lengths are deferred rather than switched to another solver. Zero-length segments refuse, but tiny positive lengths can invert the existing 1e-5 analytic reach shell without a separate shell-admission check.
 * @evidence contracts/common.md#meaningful-documentation States the pass, what each solver accepts and ignores, the reach clamp, what is preserved and blended, the deferral case, the default and stopping rule for iterations, and every throw.
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
   * Solver: twoBone is analytic for three nodes; CCD and FABRIK are iterative and admit chains of at least two nodes.
   */
  solver: "twoBone" | "ccd" | "fabrik";

  /**
   * Positive safe-integer iteration cap for CCD/FABRIK, with early exit within 1e-6 m of the goal; null uses 10. twoBone ignores this field. The cap bounds iterations, not a promise of convergence or fixed elapsed time.
   */
  iterations: number | null;

  /** Blend factor `[0, 1]` between the composed pose and the solved one. */
  influence: number;
}
