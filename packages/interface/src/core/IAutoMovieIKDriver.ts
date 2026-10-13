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
 * @evidence contracts/common.md#principled-implementation `twoBone` applies the law of cosines to the two bone lengths and a reach clamped 1e-5 inside the reachable annulus; CCD rotates joints back to front toward the goal and FABRIK alternates tip-pinned and root-pinned passes with full extension for an unreachable goal; both stop at a fixed budget or a 1e-6 m tip error, so the solve is deterministic.
 * @evidence contracts/common.md#clear-and-simple-design One driver type with a `solver` discriminant shares chain, goal, pole and influence across three solvers, and `iterations` is nullable because only the iterative solvers read it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A `twoBone` driver with a chain other than three nodes is deferred rather than quietly handed to another solver; the one compensation is FABRIK's fixed `+X` fallback for coincident joints, which keeps the solve total.
 * @evidence contracts/common.md#meaningful-documentation States the chain-length rule per solver, that only `twoBone` reads `pole`, the iteration default and early stop, what is blended and recomposed, and the throwing inputs.
 * @author Samchon
 */
export interface IAutoMovieIKDriver {
  /** Discriminator. */
  type: "ik";

  /** Bone chain node ids, root → tip. */
  chain: string[];

  /** Node whose world position the chain tip reaches for. */
  goal: string;

  /** Bend-plane control read only by `twoBone`, or `null`. */
  pole: IAutoMovieIKPole | null;

  /**
   * Solver. `twoBone` is the analytic, deterministic limb solver (build-first);
   * `ccd`/`fabrik` are iterative, for longer chains.
   */
  solver: "twoBone" | "ccd" | "fabrik";

  /**
   * Iteration cap for `ccd`/`fabrik`, a positive integer fixed for determinism;
   * the solve stops earlier once the tip is within 1e-6 m of the goal. `null`
   * uses 10. Ignored by `twoBone`.
   */
  iterations: number | null;

  /** Blend factor `[0, 1]` between the composed pose and the solved one. */
  influence: number;
}
