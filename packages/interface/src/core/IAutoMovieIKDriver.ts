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
