import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanJoints } from "../compose/IAutoMovieMotionHumanJoints";

/**
 * A keyed whole-body posture of an exercise: the body's tilt, its turn and
 * its joints, with no place of its own. Where the body is follows from what
 * bears it: the key is pinned by naming bones whose mean stays at a point
 * (`pinned`), so the support neither slides nor sinks while the joints move.
 *
 * Angles are clinical degrees. A leg stood on a flat foot under a pitched
 * trunk is written by `stood`, which gives the hip and the ankle the angles
 * that keep the foot level.
 *
 * @evidence contracts/development/common.md#meaningful-documentation pitch: Forward tilt of the whole body, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical from the heading the exercise is entered on, degrees.
 * @evidence contracts/development/design.md#principled-representation pitch: Forward tilt of the whole body, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical from the heading the exercise is entered on, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/ExerciseKey.ts (ExerciseKey.standing, return); exercise/ExerciseKey.ts (ExerciseKey.from, return); exercise/ExerciseKey.ts (ExerciseKey.of, return); exercise/ExerciseKey.ts (ExerciseKey.blend, a); exercise/ExerciseKey.ts (ExerciseKey.blend, b); exercise/ExerciseKey.ts (ExerciseKey.blend, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanJoints.Angles, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanExerciseKey {
  /**
   * The key of a body's relaxed standing: its arms hanging as the stand law hangs them (`stand.relaxed`), one record per body so a span can name it. A keyed posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation pitch: Forward tilt of the whole body, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical from the heading the exercise is entered on, degrees.
   * @evidence contracts/development/design.md#principled-representation pitch: Forward tilt of the whole body, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical from the heading the exercise is entered on, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/ExerciseKey.ts (ExerciseKey.standing, return); exercise/ExerciseKey.ts (ExerciseKey.from, return); exercise/ExerciseKey.ts (ExerciseKey.of, return); exercise/ExerciseKey.ts (ExerciseKey.blend, a); exercise/ExerciseKey.ts (ExerciseKey.blend, b); exercise/ExerciseKey.ts (ExerciseKey.blend, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanJoints.Angles identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IKey {
    /** Forward tilt of the whole body, degrees. */
    pitch: number;

    /** Tilt toward the right, degrees. */
    roll: number;

    /** Turn about the vertical from the heading the exercise is entered on, degrees. */
    yaw: number;

    /** How far the pinned bones are lifted off their place, as a share of the stature: a hop. */
    lift: number;

    /** Clinical joint angles, degrees. */
    joints: IAutoMovieMotionHumanJoints.Angles;
  }

  /**
   * The whole body's part of a key; every member is 0 when absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation pitch: Forward tilt, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical, degrees.
   * @evidence contracts/development/design.md#principled-representation pitch: Forward tilt, degrees. roll: Tilt toward the right, degrees. yaw: Turn about the vertical, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/ExerciseKey.ts (ExerciseKey.from, trunk); exercise/ExerciseKey.ts (ExerciseKey.of, trunk); exercise/WorkoutGym.ts (WorkoutGym.key, trunk); exercise/WorkoutStance.ts (WorkoutStance.stride, trunk).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in ExerciseKey.from.
   */
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
   * One side's limbs in a key; a member absent keeps the value both sides share, or 0, or for the shoulder's abduction and the elbow their relaxed 5 and 12 degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation hip: Hip flexion, degrees. spread: Hip abduction, degrees. turn: Hip rotation, degrees.
   * @evidence contracts/development/design.md#principled-representation hip: Hip flexion, degrees. spread: Hip abduction, degrees. turn: Hip rotation, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/ExerciseKey.ts (ExerciseKey.from, both); exercise/ExerciseKey.ts (ExerciseKey.from, left); exercise/ExerciseKey.ts (ExerciseKey.from, right); exercise/ExerciseKey.ts (ExerciseKey.of, both); exercise/ExerciseKey.ts (ExerciseKey.of, left); exercise/ExerciseKey.ts (ExerciseKey.of, right).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in ExerciseKey.from.
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

    /** Wrist flexion, degrees; negative bends the hand back, as a palm laid on the floor under a straight arm is. */
    wrist?: number;

    /** The shoulder girdle's lift, degrees: a shrug. */
    shrug?: number;
  }

  /**
   * What bears a key: a bone's origin, or a hand's grip socket, the centre of a fist closed on a bar.
   *
   * @evidence contracts/development/common.md#meaningful-documentation What bears a key: a bone's origin, or a hand's grip socket, the centre of a fist closed on a bar.
   * @evidence contracts/development/design.md#principled-representation Closed choices "gripLeft", "gripRight" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/ExerciseKey.ts (ExerciseKey.mean, bones); exercise/ExerciseKey.ts (ExerciseKey.at, pin); exercise/ExerciseKey.ts (ExerciseKey.pinned, pin); exercise/WorkoutPlace.ts (WorkoutPlace.of.shown, pin); exercise/WorkoutPlace.ts (WorkoutPlace.of.soles, bone); exercise/WorkoutPlace.ts (WorkoutPlace.of.grounded, bone).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Pin = AutoMovieHumanoidBone | "gripLeft" | "gripRight";
}
