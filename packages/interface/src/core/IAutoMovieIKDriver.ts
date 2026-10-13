import { IAutoMovieIKPole } from "./IAutoMovieIKPole";

/**
 * Inverse kinematics: back-solve a bone chain so its tip reaches a goal.
 *
 * Resolved in the world-space pass on composed world positions. `twoBone`
 * solves exactly three nodes analytically, clamping the reach just inside the
 * span the two bones can cover and bending in the plane `pole` selects; with
 * any other chain length it is not solved and comes back in `deferredDrivers`.
 * `ccd` and `fabrik` need at least two nodes and ignore `pole`. Each solver
 * keeps segment lengths at full influence, gives every non-tip joint the
 * shortest-arc rotation delta of its segment, blends positions and rotations by
 * `influence`, and recomposes the tip's subtree. A zero-length segment or an
 * influence outside `[0, 1]` throws, as does, for `ccd` and `fabrik`, a chain
 * shorter than two nodes or a non-positive or fractional `iterations`.
 *
 * @evidence contracts/common.md#principled-implementation `twoBone` places the middle joint by the law of cosines over the two bone lengths and the reach clamped to `[|l1 - l2| + 1e-5, l1 + l2 - 1e-5]`; `ccd` sweeps joints tip to root rotating the tip toward the goal, and `fabrik` runs backward and forward passes at fixed segment lengths, both stopping at the iteration cap or within `1e-6` m.
 * @evidence contracts/common.md#clear-and-simple-design One driver type selects among three solvers by a tag, sharing the chain, goal, influence and the rotation write-back, with the pole and iteration fields read only by the solvers that need them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A fixed iteration budget keeps the solve deterministic rather than iterating to a time limit, an unsolvable `twoBone` chain is deferred rather than solved by a different solver, and degenerate segments throw.
 * @evidence contracts/common.md#meaningful-documentation States the pass, what each solver accepts and ignores, the reach clamp, what is preserved and blended, the deferral case, the default and stopping rule for iterations, and every throw.
 * @author Samchon
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
   * Solver. `twoBone` is the analytic, deterministic limb solver; `ccd` and
   * `fabrik` are iterative, for longer chains.
   */
  solver: "twoBone" | "ccd" | "fabrik";

  /**
   * Iteration cap for `ccd` and `fabrik`, a positive integer fixed for
   * determinism; the solve stops earlier once the tip is within `1e-6` m of
   * the goal. `null` uses 10. Ignored by `twoBone`.
   */
  iterations: number | null;

  /** Blend factor `[0, 1]` between the composed pose and the solved one. */
  influence: number;
}
