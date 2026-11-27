import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanWorkoutKind,
  IAutoMovieMotionHumanWorkoutLying,
} from "@automovie/interface";

import { ExerciseKey } from "../internal/ExerciseKey";
import { WorkoutFloor } from "./WorkoutFloor";
import { WorkoutKind } from "./WorkoutKind";
import * as WorkoutLyingData from "./internal/WorkoutLyingData";

/*
 * The exercises of the workout law done lying, sitting on the floor or on
 * furniture: on the back (sit-up, crunch, glute bridge, a partner's hamstring
 * stretch), on a side (side plank), sitting on the floor (the forward fold and
 * the hurdler's stretch) and on furniture as high as the body needs (the bench
 * press, the rowing machine, the stationary bicycle).
 *
 * Every angle is provisional, read off the exercise's usual description (ACSM's
 * Guidelines, 11th ed.; NSCA's Essentials of Strength Training, 4th ed.).
 *
 * First pass: the bench, the rower's seat and rail and the bicycle are not
 * props, so nothing is shown under the body; a barbell is not held; a bridge's
 * shoulders and a side plank's forearm are kept by the angles alone and may
 * slide by the difference between the keys. The side plank's roll is solved on
 * the body so its forearm rests on the floor level with its feet.
 */
export namespace WorkoutLying {
  /*
   * The exercises.
   */
  export const KINDS: Readonly<
    Record<
      IAutoMovieMotionHumanWorkoutLying.Name,
      IAutoMovieMotionHumanWorkoutKind
    >
  > = {
    /*
     * A sit-up: from hook lying, the trunk raised to the knees, 1 s each way
     * (provisional).
     */
    sitUp: {
      base: "lying",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      // The seat and the hooked feet bear throughout; the back lies on the
      // floor at the bottom and leaves it as the trunk curls up.
      supports: [
        ...WorkoutLyingData.SEATED,
        { part: "leftFoot", kind: "plant" },
        { part: "rightFoot", kind: "plant" },
        { part: "back", kind: "lie", at: ["down"] },
      ],
      enter: 2.4,
      count: 5,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          hook(body, { shoulder: 30, elbow: 130 }),
          1,
          "lower",
          "down",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -25, spine: [15, 0, 0] },
            { hip: 110, knee: 90, ankle: -45, shoulder: 30, elbow: 130 },
          ),
          1,
          "curl",
          "up",
        ),
      ],
    },

    /*
     * A crunch: from hook lying, the shoulders curled off the floor.
     */
    crunch: {
      base: "lying",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      supports: WorkoutLyingData.SUPINE,
      enter: 2.4,
      count: 8,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          hook(body, { shoulder: 30, elbow: 130 }),
          0.8,
          "lower",
          "down",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -90, spine: [25, 0, 0], chest: [25, 0, 0], neck: 20 },
            { hip: 45, knee: 90, ankle: -45, shoulder: 30, elbow: 130 },
          ),
          0.8,
          "curl",
          "up",
        ),
      ],
    },

    /*
     * A glute bridge: from hook lying, the hips raised until the thighs
     * continue the trunk, over the planted feet.
     */
    gluteBridge: {
      base: "lying",
      anchor: "hips",
      pin: ["leftFoot", "rightFoot"],
      supports: [
        { part: "leftFoot", kind: "plant" },
        { part: "rightFoot", kind: "plant" },
        { part: "back", kind: "lie" },
      ],
      enter: 2.4,
      count: 5,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(hook(body, { elbow: 5 }), 1, "lower", "down"),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -115 },
            { knee: 115, shoulder: -25, elbow: 5 },
          ),
          1,
          "raise",
          "bridge",
          1,
        ),
      ],
    },

    /*
     * A partner's hamstring stretch, the stretched person's part: on the back,
     * the right leg raised straight and held 20 s; the helper's hands are a
     * `touch` on the calf.
     */
    pnfHamstring: {
      base: "lying",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      supports: WorkoutLyingData.SUPINE,
      enter: 2.4,
      count: 1,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(body, { pitch: -90 }, { ankle: -20, elbow: 5 }),
          1.5,
          "lower",
          "down",
        ),
        WorkoutKind.pose(
          ExerciseKey.from(
            body,
            { pitch: -90 },
            { ankle: -20, elbow: 5 },
            {},
            {
              hip: 80,
              ankle: 0,
            },
          ),
          1.5,
          20,
        ),
      ],
    },

    /*
     * A side plank on the left forearm and the feet, held 20 s (provisional
     * angles).
     */
    sidePlank: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftFoot", "rightFoot"],
      supports: [
        { part: "leftLowerArm", kind: "bear" },
        { part: "leftFoot", kind: "plant" },
      ],
      enter: 2.4,
      count: 1,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        // Tipped until the left forearm rests on the floor level with the
        // feet: both supports bear (`WorkoutFloor.rolled`).
        WorkoutKind.pose(
          WorkoutFloor.rolled(
            body,
            /^left(LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/,
            (roll: number): IAutoMovieMotionHumanExerciseKey.IKey =>
              ExerciseKey.from(
                body,
                { roll },
                { raise: 0, elbow: 5 },
                { raise: 80, elbow: 90 },
                { spread: -9 },
              ),
          ),
          0,
          20,
        ),
      ],
    },

    /*
     * The seated forward fold: from sitting with the legs straight, the trunk
     * folded over them, held 20 s.
     */
    seatedFold: {
      base: "seated",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      supports: WorkoutLyingData.SEATED,
      enter: 2,
      count: 1,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(longSit(body), 1.5, "sitUp", "sitting"),
        WorkoutKind.pose(
          ExerciseKey.from(
            body,
            { pitch: 35, spine: [20, 0, 0], chest: [15, 0, 0], neck: 10 },
            { hip: 125, shoulder: 95, elbow: 5 },
          ),
          1.5,
          20,
        ),
      ],
    },

    /*
     * The hurdler's hamstring stretch: sitting, the left knee bent out, the
     * trunk folded over the straight right leg, held 20 s.
     */
    hurdlerStretch: {
      base: "seated",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      supports: WorkoutLyingData.SEATED,
      enter: 2,
      count: 1,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(longSit(body), 1.5, "sitUp", "sitting"),
        WorkoutKind.pose(
          ExerciseKey.from(
            body,
            { pitch: 30, spine: [20, 0, 0], chest: [10, 0, 0] },
            { hip: 120, shoulder: 90, elbow: 5 },
            { spread: 45, knee: 130 },
          ),
          1.5,
          20,
        ),
      ],
    },

    /*
     * A bench press without its bar: on the back at the height of the knees,
     * the feet on the floor, the arms pressed up and lowered.
     */
    benchPress: {
      base: "lying",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      raise: (body: IAutoMovieMotionHumanBody): number =>
        body.measure.shank + body.measure.ankleHeight,
      // On the back on the bench, the feet on the floor.
      supports: [
        ...WorkoutLyingData.SUPINE,
        { part: "leftFoot", kind: "plant" },
        { part: "rightFoot", kind: "plant" },
      ],
      enter: 2.4,
      count: 5,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -90 },
            { knee: 90, shoulder: 90, raise: 0, elbow: 3 },
          ),
          1,
          "press",
          "lockout",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -90 },
            { knee: 90, shoulder: 15, raise: 70, elbow: 95 },
          ),
          1.5,
          "lower",
          "chest",
        ),
      ],
    },

    /*
     * A rowing stroke on a machine: the feet fixed, the seat a third of the
     * shank high (provisional); the catch and the finish.
     */
    rowing: {
      base: "seated",
      anchor: "hips",
      pin: ["leftFoot", "rightFoot"],
      raise: (body: IAutoMovieMotionHumanBody): number =>
        body.measure.shank / 3,
      supports: [
        { part: "seat", kind: "seat" },
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
            { pitch: 15 },
            { hip: 125, knee: 110, ankle: 15, shoulder: 80, elbow: 3 },
          ),
          1.4,
          "recover",
          "catch",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -15 },
            { hip: 75, knee: 10, ankle: -15, shoulder: -15, elbow: 110 },
          ),
          0.8,
          "drive",
          "finish",
        ),
      ],
    },

    /*
     * Pedalling a stationary bicycle: on a saddle the height of the leg less a
     * tenth (provisional), one leg down as the other comes up.
     */
    cycling: {
      base: "seated",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      raise: (body: IAutoMovieMotionHumanBody): number =>
        0.9 * (body.measure.thigh + body.measure.shank),
      supports: WorkoutLyingData.SEATED,
      enter: 2,
      count: 8,
      route: (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => {
        const pedal = (
          down: AutoMovieHumanSide,
        ): IAutoMovieMotionHumanExerciseKey.IKey => {
          const low: IAutoMovieMotionHumanExerciseKey.ILimb = {
            hip: 60,
            knee: 30,
          };
          const high: IAutoMovieMotionHumanExerciseKey.ILimb = {
            hip: 110,
            knee: 105,
          };
          return ExerciseKey.from(
            body,
            { pitch: 35, neck: -25 },
            { shoulder: 80, elbow: 15 },
            down === "left" ? low : high,
            down === "left" ? high : low,
          );
        };
        return [
          WorkoutKind.step(pedal("left"), 0.4, "leftDown", "leftBottom"),
          WorkoutKind.step(pedal("right"), 0.4, "rightDown", "rightBottom"),
        ];
      },
    },
  };

  /*
   * Hook lying: on the back, the knees bent and the feet flat.
   */
  const hook = (
    body: IAutoMovieMotionHumanBody,
    arms: IAutoMovieMotionHumanExerciseKey.ILimb,
  ): IAutoMovieMotionHumanExerciseKey.IKey =>
    ExerciseKey.from(
      body,
      { pitch: -90 },
      { hip: 45, knee: 90, ankle: -45, ...arms },
    );

  /*
   * Sitting on the floor with the legs straight ahead.
   */
  const longSit = (
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanExerciseKey.IKey =>
    ExerciseKey.from(body, {}, { hip: 90, shoulder: 30, elbow: 20 });
}
