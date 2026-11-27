import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";

/**
 * Whether a limb can put its end on a point, and what happens when it cannot.
 *
 * An arm's end is its wrist and its root the shoulder joint; a leg's end is its
 * ankle and its root the hip joint. The end reaches every point no farther from
 * the root than the limb's two segments laid straight (the upper arm and the
 * forearm, the thigh and the shank). A goal beyond that leaves the inverse
 * kinematics with a straight limb that stops short, so a law decides beforehand
 * by one of three policies:
 *
 * - `refuse`: the action is not planned, and the error states the limb, the goal
 *   and the shortfall in millimetres; the choice for a contact that must be met
 *   (a handshake, a grasp, a strike on a person).
 * - `lean`: the trunk tips forward about the hips by the smallest pitch that
 *   brings the shoulder within reach, up to {@link LEAN_LIMIT}; the choice for a
 *   reach a person would bend into (a table, an offered object). It refuses
 *   when that limit is not enough, and for a leg, which has no lean.
 * - `clamp`: the goal moves along its line from the root onto the sphere of the
 *   limb's reach; the choice for a goal with no contact (a point in the air, a
 *   gesture, a drill without a target).
 */
export namespace IAutoMovieMotionHumanReach {
  /** What a law does with a goal out of reach; the namespace states each. */
  export type Policy = (readonly ["refuse", "lean", "clamp"])[number];

  /** A limb that reaches. */
  export type Limb = (readonly [
    "leftArm",
    "rightArm",
    "leftLeg",
    "rightLeg",
  ])[number];

  /** A limb's reach toward one point. */
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

  /** A goal made reachable. */
  export interface IFit {
    /** The posture, tipped forward when the policy leaned. */
    posture: IAutoMovieMotionHumanPosture;

    /** The limb's end point, moved when the policy clamped; world metres. */
    point: IAutoMovieVector3;
  }
}
