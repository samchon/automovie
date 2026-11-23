import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanJoints } from "../compose/IAutoMovieMotionHumanJoints";

/**
 * A keyed whole-body posture of an exercise: the body's tilt, its turn and its
 * joints, with no place of its own. Where the body is follows from what bears
 * it: the key is pinned by naming bones whose mean stays at a point (`pinned`),
 * so the support neither slides nor sinks while the joints move.
 *
 * Angles are clinical degrees. A leg stood on a flat foot under a pitched trunk
 * is written by `stood`, which gives the hip and the ankle the angles that keep
 * the foot level.
 */
export namespace IAutoMovieMotionHumanExerciseKey {
  /**
   * The key of a body's relaxed standing: its arms hanging as the stand law
   * hangs them (`stand.relaxed`), one record per body so a span can name it. A
   * keyed posture.
   */
  export interface IKey {
    /** Forward tilt of the whole body, degrees. */
    pitch: number;

    /** Tilt toward the right, degrees. */
    roll: number;

    /**
     * Turn about the vertical from the heading the exercise is entered on,
     * degrees.
     */
    yaw: number;

    /**
     * How far the pinned bones are lifted off their place, as a share of the
     * stature: a hop.
     */
    lift: number;

    /** Clinical joint angles, degrees. */
    joints: IAutoMovieMotionHumanJoints.Angles;
  }

  /** The whole body's part of a key; every member is 0 when absent. */
  export interface ITrunk {
    /** Forward tilt, degrees. */
    pitch?: number;

    /** Tilt toward the right, degrees. */
    roll?: number;

    /** Turn about the vertical, degrees. */
    yaw?: number;

    /** Lift, a share of the stature. */
    lift?: number;

    /** The spine's `[flexion, lateral, twist]`, degrees. */
    spine?: readonly [number, number, number];

    /** The chest's `[flexion, lateral, twist]`, degrees. */
    chest?: readonly [number, number, number];

    /** The neck's flexion, degrees; negative looks up. */
    neck?: number;
  }

  /**
   * One side's limbs in a key; a member absent keeps the value both sides
   * share, or 0, or for the shoulder's abduction and the elbow their relaxed 5
   * and 12 degrees.
   */
  export interface ILimb {
    /** Hip flexion, degrees. */
    hip?: number;

    /** Hip abduction, degrees. */
    spread?: number;

    /** Hip rotation, degrees. */
    turn?: number;

    /** Knee flexion, degrees. */
    knee?: number;

    /** Ankle dorsiflexion, degrees; negative points the foot. */
    ankle?: number;

    /** Toe extension, degrees. */
    toes?: number;

    /** Shoulder flexion, degrees. */
    shoulder?: number;

    /** Shoulder abduction, degrees. */
    raise?: number;

    /** Shoulder rotation, degrees. */
    twist?: number;

    /** Elbow flexion, degrees. */
    elbow?: number;

    /**
     * Wrist flexion, degrees; negative bends the hand back, as a palm laid on
     * the floor under a straight arm is.
     */
    wrist?: number;

    /** The shoulder girdle's lift, degrees: a shrug. */
    shrug?: number;
  }

  /**
   * What bears a key: a bone's origin, or a hand's grip socket, the centre of a
   * fist closed on a bar.
   */
  export type Pin = AutoMovieHumanoidBone | "gripLeft" | "gripRight";
}
