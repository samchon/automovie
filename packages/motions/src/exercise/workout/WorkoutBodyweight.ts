import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanWorkoutBodyweight,
  IAutoMovieMotionHumanWorkoutKind,
} from "@automovie/interface";

import { ExerciseKey } from "../internal/ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";

/*
 * The bodyweight movements of the workout law a gym programme names beside the
 * ones the other tables hold. On the floor: the pike push-up, the superman, the
 * bird dog, the lying leg raise, the bicycle crunch, the Russian twist and the
 * dead bug. On two bars at the hips' height: the dip.
 *
 * Every angle is provisional, read off the exercise's usual description (ACSM's
 * Guidelines, 11th ed.; NSCA's Essentials of Strength Training and
 * Conditioning, 4th ed., for the dip); none is a measured value.
 *
 * The bars of a dip are places at the standing hips' height beside the body
 * unless the author names a prop (`on`): a support exercise's bars stand within
 * the standing body's reach. First pass: the dip's base is the grammar's
 * `hanging`, the body borne by its hands with its feet off the floor, there
 * being no base of a body supported above its hands; a bird dog's hands are
 * kept by the angles alone.
 */
export namespace WorkoutBodyweight {
  /*
   * Lying on the back with the arms by the sides.
   */
  const supine = (
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey =>
    ExerciseKey.from(body, { pitch: -90 }, { ankle: -20, elbow: 5 });

  /*
   * A kind done lying or sitting on the floor, the pelvis kept.
   */
  const floor = (
    base: IAutoMovieMotionHumanWorkoutKind["base"],
    supports: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[],
    reps: number,
    route: IAutoMovieMotionHumanWorkoutKind["route"],
    alternate: boolean = false,
  ): IAutoMovieMotionHumanWorkoutKind => ({
    base,
    anchor: "hips",
    pin: ["leftUpperLeg", "rightUpperLeg"],
    supports,
    alternate,
    enter: 2.4,
    count: reps,
    route,
  });

  /*
   * The back bears.
   */
  const BACK: readonly IAutoMovieMotionHumanWorkoutKind.ISupport[] = [
    { part: "back", kind: "lie" },
  ];

  /*
   * The exercises.
   */
  export const KINDS: Readonly<
    Record<
      IAutoMovieMotionHumanWorkoutBodyweight.Name,
      IAutoMovieMotionHumanWorkoutKind
    >
  > = {
    /*
     * A pike push-up: from the hips-high support on the hands and feet, the
     * head lowered between the hands.
     */
    pikePushUp: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftFoot", "rightFoot"],
      hands: true,
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant" },
        { part: "leftFoot", kind: "plant" },
        { part: "rightFoot", kind: "plant" },
      ],
      enter: 2,
      count: 5,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: 140, neck: 10 },
            { hip: 105, ankle: 35, shoulder: 175, elbow: 3, wrist: -50 },
          ),
          1,
          "press",
          "top",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: 150, neck: 10 },
            { hip: 115, ankle: 35, shoulder: 150, elbow: 95, wrist: -50 },
          ),
          1.2,
          "lower",
          "bottom",
        ),
      ],
    },

    /*
     * A superman: lying face down, the arms ahead and the legs lifted off the
     * floor together.
     */
    superman: floor(
      "lying",
      BACK,
      5,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: 88 },
            { ankle: -45, shoulder: 170, raise: 10, elbow: 5 },
          ),
          1,
          "lower",
          "down",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: 88, spine: [-12, 0, 0], chest: [-12, 0, 0], neck: -15 },
            { hip: -15, ankle: -45, shoulder: 185, raise: 10, elbow: 5 },
          ),
          1,
          "lift",
          "top",
          1,
        ),
      ],
    ),

    /*
     * A bird dog: on hands and knees, one arm and the opposite leg reached
     * level, alternating.
     */
    birdDog: {
      base: "kneeling",
      anchor: "hips",
      pin: ["leftLowerLeg", "rightLowerLeg"],
      // On all fours each hand and knee bears; reached level, the raised
      // arm's hand and the reached leg's knee leave the floor, the right
      // arm and the left leg first and the other pair on alternate
      // repetitions.
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant", at: ["kneeling"] },
        { part: "rightLowerLeg", kind: "bear" },
        { part: "leftLowerLeg", kind: "bear", at: ["kneeling"] },
      ],
      alternate: true,
      enter: 2.4,
      count: 6,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: 85, neck: -30 },
            { hip: 85, knee: 95, ankle: -40, shoulder: 85, elbow: 3 },
          ),
          1,
          "lower",
          "kneeling",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: 85, neck: -30 },
            { hip: 85, knee: 95, ankle: -40, shoulder: 85, elbow: 3 },
            { hip: 0, knee: 5 },
            { shoulder: 175 },
          ),
          1,
          "reach",
          "level",
          1,
        ),
      ],
    },

    /*
     * A lying leg raise: on the back, both straight legs raised to upright and
     * lowered.
     */
    lyingLegRaise: floor(
      "lying",
      BACK,
      6,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(supine(body), 1.5, "lower", "down"),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -90 },
            { hip: 88, ankle: -20, elbow: 5 },
          ),
          1.2,
          "raise",
          "top",
        ),
      ],
    ),

    /*
     * A bicycle crunch: on the back, one knee drawn in as the opposite shoulder
     * turns to it, alternating.
     */
    bicycleCrunch: floor(
      "lying",
      BACK,
      8,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -90, chest: [15, 0, 0], neck: 15 },
            { hip: 40, knee: 20, shoulder: 60, raise: 60, elbow: 140 },
          ),
          0.5,
          "open",
          "extended",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -90, spine: [15, 0, 25], chest: [20, 0, 20], neck: 15 },
            { hip: 40, knee: 20, shoulder: 60, raise: 60, elbow: 140 },
            {},
            { hip: 100, knee: 110 },
          ),
          0.5,
          "crunch",
          "kneeIn",
        ),
      ],
      true,
    ),

    /*
     * A Russian twist: sitting leaned back with the knees bent, the trunk
     * turned to each side in turn.
     */
    russianTwist: floor(
      "seated",
      [{ part: "seat", kind: "seat" }],
      8,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -35 },
            { hip: 85, knee: 80, ankle: -10, shoulder: 45, elbow: 90 },
          ),
          0.5,
          "centre",
          "middle",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -35, spine: [0, 0, 25], chest: [0, 0, 20] },
            { hip: 85, knee: 80, ankle: -10, shoulder: 45, elbow: 90 },
          ),
          0.5,
          "twist",
          "side",
        ),
      ],
      true,
    ),

    /*
     * A dead bug: on the back with the arms up and the hips and knees square,
     * one arm and the opposite leg lowered, alternating.
     */
    deadBug: floor(
      "lying",
      BACK,
      6,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -90 },
            { hip: 90, knee: 90, shoulder: 90, raise: 0, elbow: 3 },
          ),
          1,
          "gather",
          "square",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -90 },
            { hip: 90, knee: 90, shoulder: 90, raise: 0, elbow: 3 },
            { hip: 10, knee: 5 },
            { shoulder: 175 },
          ),
          1.2,
          "lower",
          "long",
          0.5,
        ),
      ],
      true,
    ),

    /*
     * A dip on two bars at the hips' height: the body lowered between the hands
     * until the upper arms are level, and pressed up.
     */
    dip: {
      base: "hanging",
      anchor: "bar",
      pin: ["gripLeft", "gripRight"],
      bars: (body: IAutoMovieMotionHumanBody): number => body.measure.hipHeight,
      supports: [
        { part: "leftHand", kind: "grip", prop: true },
        { part: "rightHand", kind: "grip", prop: true },
      ],
      enter: 1,
      count: 5,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(body, {}, { knee: 70, raise: 8, elbow: 3 }),
          1,
          "press",
          "top",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: 15 },
            { hip: 15, knee: 70, shoulder: -60, raise: 8, elbow: 95 },
          ),
          1.3,
          "lower",
          "bottom",
        ),
      ],
    },
  };
}
