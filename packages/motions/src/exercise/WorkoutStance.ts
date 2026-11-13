import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";

/**
 * What the standing kinds of the workout law share: the supports of a
 * standing body, the record of a kind whose pinned bones stay where they
 * stand, and the stances whose angles are solved on the body so both feet
 * reach the floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds and why the stances are solved.
 * @evidence contracts/development/design.md#principled-representation Supports as data, a kind as one record and a stance as a key, so the tables of standing kinds hold only what differs between exercises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `WorkoutStanding` and `WorkoutPoses` both read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres: a stance's angles follow from the thigh and the shank.
 */
export namespace WorkoutStance {
  /** Both feet bear. */
  export const FEET: readonly WorkoutKind.ISupport[] = [
    { part: "leftFoot", kind: "plant" },
    { part: "rightFoot", kind: "plant" },
  ];

  /** The left foot bears. */
  export const LEFT: readonly WorkoutKind.ISupport[] = [
    { part: "leftFoot", kind: "plant" },
  ];

  /** The two feet's ankles. */
  export const ANKLES: readonly AutoMovieHumanoidBone[] = [
    "leftFoot",
    "rightFoot",
  ];

  /**
   * A standing kind: the named bones stay where they stand.
   *
   * @param pin The bones that stay.
   * @param supports The parts that bear.
   * @param enter Seconds from standing to the first posture; 0 when it is standing.
   * @param reps Repetitions when the author names none.
   * @param route The postures of one repetition.
   * @param alternate Whether every other repetition is mirrored; `false` when absent.
   * @returns The kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the default.
   * @evidence contracts/development/implementation.md#principled-implementation Fixes the two members every standing kind shares, the base and the `stance` anchor, so a table row states only what differs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    pin: readonly AutoMovieHumanoidBone[],
    supports: readonly WorkoutKind.ISupport[],
    enter: number,
    reps: number,
    route: WorkoutKind["route"],
    alternate: boolean = false,
  ): WorkoutKind {
    return {
      base: "standing",
      anchor: "stance",
      pin,
      supports,
      enter,
      reps,
      route,
      alternate,
    };
  }

  /**
   * Standing, as the step every repetition returns to (`recover`, `stood`).
   *
   * @param seconds Seconds taken to return to it.
   * @returns The step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the event names.
   * @evidence contracts/development/implementation.md#principled-implementation The relaxed standing key itself, which the workout law recognises as the posture stood in before and after.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function rest(seconds: number): WorkoutKind.IStep {
    return WorkoutKind.step(ExerciseKey.STOOD, seconds, "recover", "stood");
  }

  /**
   * The front thigh's forward angle of a split stance whose straight back
   * leg leans back by an angle: the front shank stays upright and both feet
   * stand on the floor.
   *
   * @param body The body.
   * @param back The back leg's lean from the vertical, degrees.
   * @returns Degrees; the front hip's and knee's flexion under an upright trunk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and what the result is used as.
   * @evidence contracts/development/implementation.md#principled-implementation The pelvis's height over the back foot is the leg's length times the lean's cosine; over the front foot it is the shank plus the thigh times its angle's cosine; the two are equal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arccosine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A lean past what the thigh can make up clamps at a level thigh.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function split(body: IHumanBody, back: number): number {
    const thigh: number = body.measure.thigh;
    const shank: number = body.measure.shank;
    const height: number =
      (thigh + shank) * Math.cos((back * Math.PI) / 180) - shank;
    return (
      (Math.acos(Math.max(0, Math.min(1, height / thigh))) * 180) / Math.PI
    );
  }

  /**
   * The straight leg's lean of a stance whose other thigh is bent by an
   * angle over an upright shank: the inverse of `split`.
   *
   * @param body The body.
   * @param bent The bent thigh's angle from the vertical, degrees.
   * @returns Degrees from the vertical.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The same equality of the pelvis's height over the two feet, solved for the straight leg.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arccosine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function straight(body: IHumanBody, bent: number): number {
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
   * A split stance under a pitched trunk: the left leg back and straight,
   * the right knee over its foot.
   *
   * @param body The body.
   * @param back The back leg's lean from the vertical, degrees.
   * @param trunk The whole body's part of the key.
   * @param arms The arms' angles.
   * @returns The key.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and which leg is which.
   * @evidence contracts/development/implementation.md#principled-implementation Each hip takes the trunk's pitch plus its thigh's angle, and the back ankle its leg's lean, so both feet stay level on the floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One solved angle and one key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `split`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function stride(
    body: IHumanBody,
    back: number,
    trunk: ExerciseKey.ITrunk,
    arms: ExerciseKey.ILimb,
  ): ExerciseKey.IKey {
    const front: number = split(body, back);
    const pitch: number = trunk.pitch ?? 0;
    return ExerciseKey.of(
      trunk,
      arms,
      { hip: pitch - back, ankle: back },
      { hip: pitch + front, knee: front },
    );
  }
}
