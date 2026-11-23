import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieSwivelSeed } from "./IAutoMovieSwivelSeed";

/**
 * The articulation `hingedArmArticulation` chose for an arm reach, with its
 * range-of-motion cost.
 *
 * Every candidate the solver scores lands the hand on the reachable shell
 * toward the target, so the choice among them is legality first and then the
 * least clinical deviation from the anatomical neutral. `reachPose` lowers
 * `upper` and `lower` into clinical angles for the shoulder and elbow. Its
 * branch and swivel are the seed a fit of a nearby target continues from
 * (`IAutoMovieSwivelNear`).
 */
export interface IAutoMovieHingedArticulation extends IAutoMovieSwivelSeed {
  /** Bone-local articulation delta for the chain-root joint (the shoulder). */
  upper: IAutoMovieQuaternion;

  /**
   * Bone-local articulation delta for the mid joint (the elbow): a pure
   * rotation about that joint's own flexion axis, so its abduction and twist
   * decompose to exactly zero.
   */
  lower: IAutoMovieQuaternion;

  /**
   * Total ROM overshoot of the chosen candidate in degrees, `0` when the pose
   * satisfies both joints. Reported rather than hidden: a rig whose declared
   * ranges genuinely cannot hold any pose that reaches the target must still
   * say so, instead of the solver quietly returning its least-bad attempt as if
   * it were clean.
   *
   * `Infinity` when the scorer found a violation with no measurable overshoot,
   * which {@link jointRomOvershoot} reserves for a non-finite angle: unusable
   * rather than free, so a malformed candidate can never win the selection.
   */
  overshoot: number;

  /**
   * Metres the effector rests short of (or past) the target along the line from
   * the chain root, because the target distance lies outside the chain's span
   * or the mid joint stopped at a limit of its own range; `0` when a legal
   * hinge angle reaches the distance.
   */
  shortfall: number;

  /**
   * The chosen candidate's exact deviation, the scorer's tie-break after the
   * overshoot.
   */
  deviation: number;

  /**
   * The chosen candidate's second key (the scorer's `tiebreak`), when the sweep
   * has a `tie`.
   */
  second?: number;
}
