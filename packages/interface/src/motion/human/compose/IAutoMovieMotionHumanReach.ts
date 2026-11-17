import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Whether a limb can put its end on a point, and what happens when it cannot.
 *
 * An arm's end is its wrist and its root the shoulder joint; a leg's end is
 * its ankle and its root the hip joint. The end reaches every point no
 * farther from the root than the limb's two segments laid straight (the
 * upper arm and the forearm, the thigh and the shank). A goal beyond that
 * leaves the inverse kinematics with a straight limb that stops short, so a
 * law decides beforehand by one of three policies:
 *
 * - `refuse`: the action is not planned, and the error states the limb, the
 *   goal and the shortfall in millimetres; the choice for a contact that
 *   must be met (a handshake, a grasp, a strike on a person).
 * - `lean`: the trunk tips forward about the hips by the smallest pitch that
 *   brings the shoulder within reach, up to {@link LEAN_LIMIT}; the choice
 *   for a reach a person would bend into (a table, an offered object). It
 *   refuses when that limit is not enough, and for a leg, which has no lean.
 * - `clamp`: the goal moves along its line from the root onto the sphere of
 *   the limb's reach; the choice for a goal with no contact (a point in the
 *   air, a gesture, a drill without a target).
 *
 * @evidence contracts/development/common.md#meaningful-documentation root: The limb's root joint (the shoulder or the hip), world metres. length: The length of the limb's two segments laid straight, metres. distance: The distance from the root to the point, metres.
 * @evidence contracts/development/design.md#principled-representation root: The limb's root joint (the shoulder or the hip), world metres. length: The length of the limb's two segments laid straight, metres. distance: The distance from the root to the point, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanReach.ts (AutoMovieMotionHumanReach.measure, return); compose/AutoMovieMotionHumanReach.ts (AutoMovieMotionHumanReach.clamp, check); compose/AutoMovieMotionHumanReach.ts (AutoMovieMotionHumanReach.refuse, check); compose/AutoMovieMotionHumanReach.ts (AutoMovieMotionHumanReach.check, return); compose/AutoMovieMotionHumanReach.ts (AutoMovieMotionHumanReach.lean.at, return); compose/AutoMovieMotionHumanReach.ts (AutoMovieMotionHumanReach.fit, policy).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanReach {
  /**
   * What a law does with a goal out of reach; the namespace states each.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Says what the union decides and where each member is described.
   * @evidence contracts/development/design.md#principled-representation The three answers to an unreachable goal: give up, move the body, or move the goal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, read by `fit`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed literal union instead of flags that could combine into a contradiction.
   */
  export type Policy = (readonly ["refuse", "lean", "clamp"])[number];

  /**
   * A limb that reaches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the four limbs a reach is measured for.
   * @evidence contracts/development/design.md#principled-representation The posture's own limb keys, so a check names the goal it guards.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, used by every function here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A literal union, not a string.
   */
  export type Limb = (readonly [
    "leftArm",
    "rightArm",
    "leftLeg",
    "rightLeg",
  ])[number];

  /**
   * A limb's reach toward one point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record measures; each member gives its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The centre and the radius of the reachable ball with the goal's distance from the centre, the three numbers the comparison is made of.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members; `shortfall` is kept beside the two it follows from because every reader branches on it and an error prints it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All members required and in metres; reach is not reduced to a boolean that would hide by how much.
   */
  export interface ICheck {
    /** The limb's root joint (the shoulder or the hip), world metres. */
    root: IAutoMovieVector3;

    /** The length of the limb's two segments laid straight, metres. */
    length: number;

    /** The distance from the root to the point, metres. */
    distance: number;

    /** How far the point is beyond reach, metres; 0 when it is within reach. */
    shortfall: number;
  }

  /**
   * A goal made reachable.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member says what a policy may have changed.
   * @evidence contracts/development/design.md#principled-representation A policy changes the posture (a lean) or the point (a clamp), so the result carries both as they are after it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, returned by `fit` only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members are always present, so a caller never asks which policy ran before reading them.
   */
  export interface IFit {
    /** The posture, tipped forward when the policy leaned. */
    posture: IAutoMovieMotionHumanPosture;

    /** The limb's end point, moved when the policy clamped; world metres. */
    point: IAutoMovieVector3;
  }
}
