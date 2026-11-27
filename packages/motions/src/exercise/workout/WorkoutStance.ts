import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import { ExerciseKey } from "../internal/ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";

/**
 * A standing kind: the named bones stay where they stand.
 *
 * @param pin The bones that stay.
 * @param supports The parts that bear.
 * @param enter Seconds from standing to the first posture; 0 when it is
 *   standing.
 * @param reps Repetitions when the author names none.
 * @param route The postures of one repetition.
 * @param alternate Whether every other repetition is mirrored; `false` when
 *   absent.
 * @param strides Whether the feet move into a stance of the kind's own; `false`
 *   when absent, and the bearing feet are then held where they stand.
 * @returns The kind.
 */
export function WorkoutStance(
  pin: readonly AutoMovieHumanoidBone[],
  supports: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[],
  enter: number,
  reps: number,
  route: IAutoMovieMotionHumanWorkoutKind["route"],
  alternate: boolean = false,
  strides: boolean = false,
): IAutoMovieMotionHumanWorkoutKind {
  return {
    base: "standing",
    anchor: "stance",
    pin,
    supports,
    enter,
    count: reps,
    route,
    alternate,
    strides,
  };
}

/**
 * What the standing kinds of the workout law share: the supports of a standing
 * body, the record of a kind whose pinned bones stay where they stand, and the
 * stances whose angles are solved on the body so both feet reach the floor.
 */
export namespace WorkoutStance {
  /** Both feet bear. */
  export const FEET: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[] = [
    { part: "leftFoot", kind: "plant" },
    { part: "rightFoot", kind: "plant" },
  ];

  /** The left foot bears. */
  export const LEFT: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[] = [
    { part: "leftFoot", kind: "plant" },
  ];

  /** The two feet's ankles. */
  export const ANKLES: readonly AutoMovieHumanoidBone[] = [
    "leftFoot",
    "rightFoot",
  ];

  /**
   * Standing, as the step every repetition returns to (`recover`, `stood`).
   *
   * @param body The body.
   * @param seconds Seconds taken to return to it.
   * @returns The step.
   */
  export function rest(
    body: IAutoMovieMotionHumanBody,
    seconds: number,
  ): IAutoMovieMotionHumanWorkoutKind.IStep {
    return WorkoutKind.step(
      ExerciseKey.standing(body),
      seconds,
      "recover",
      "stood",
    );
  }

  /**
   * The front thigh's forward angle of a split stance whose straight back leg
   * leans back by an angle: the front shank stays upright and both feet stand
   * on the floor.
   *
   * @param body The body.
   * @param back The back leg's lean from the vertical, degrees.
   * @returns Degrees; the front hip's and knee's flexion under an upright
   *   trunk.
   */
  export function split(body: IAutoMovieMotionHumanBody, back: number): number {
    const thigh: number = body.measure.thigh;
    const shank: number = body.measure.shank;
    const height: number =
      (thigh + shank) * Math.cos((back * Math.PI) / 180) - shank;
    return (
      (Math.acos(Math.max(0, Math.min(1, height / thigh))) * 180) / Math.PI
    );
  }

  /**
   * The straight leg's lean of a stance whose other thigh is bent by an angle
   * over an upright shank: the inverse of `split`.
   *
   * @param body The body.
   * @param bent The bent thigh's angle from the vertical, degrees.
   * @returns Degrees from the vertical.
   */
  export function straight(
    body: IAutoMovieMotionHumanBody,
    bent: number,
  ): number {
    const thigh: number = body.measure.thigh;
    const shank: number = body.measure.shank;
    return (
      (Math.acos(
        (thigh * Math.cos((bent * Math.PI) / 180) + shank) / (thigh + shank),
      ) *
        180) /
      Math.PI
    );
  }

  /**
   * A split stance under a pitched trunk: the left leg back and straight, the
   * right knee over its foot.
   *
   * @param body The body.
   * @param back The back leg's lean from the vertical, degrees.
   * @param trunk The whole body's part of the key.
   * @param arms The arms' angles.
   * @returns The key.
   */
  export function stride(
    body: IAutoMovieMotionHumanBody,
    back: number,
    trunk: IAutoMovieMotionHumanExerciseKey.ITrunk,
    arms: IAutoMovieMotionHumanExerciseKey.ILimb,
  ): IAutoMovieMotionHumanExerciseKey.IKey {
    const front: number = split(body, back);
    const pitch: number = trunk.pitch ?? 0;
    return ExerciseKey.from(
      body,
      trunk,
      arms,
      { hip: pitch - back, ankle: back },
      { hip: pitch + front, knee: front },
    );
  }
}
