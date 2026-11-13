import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutFloor } from "./WorkoutFloor";
import { WorkoutKind } from "./WorkoutKind";

/**
 * The exercises of the workout law that are done on a box or a bench the
 * author names (`on`): the step-up, the incline push-up (the hands on the
 * bench) and the decline push-up (the feet on it).
 *
 * Each solves its angles from the support's own height: a step-up's knee
 * bends as far as lifts the foot onto the box with the other leg straight,
 * and a push-up's pitch puts the shoulders the arm's reach above the hands
 * with the toes where they bear. The part that bears on the prop is pinned
 * on the prop's place; the other is kept by the angles.
 *
 * With no support named, the kind is done on an imagined one a quarter of
 * the stature high, so the row still plans alone.
 *
 * First pass: a step-up stays on the box's edge, the trailing foot hanging
 * beside it, and does not step down the far side; the feet of an incline
 * push-up and the palms' turn of a decline one are the keys', not solved
 * onto the floor; every angle not solved is provisional (NSCA's Essentials
 * of Strength Training and Conditioning, 4th ed., for the exercises'
 * positions).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, what is solved from the support, the default and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One `WorkoutKind` per exercise whose route reads the support's height, so one row serves any box or bench.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table and its default height.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No furniture size is fixed: the height is the prop's, or a share of the stature.
 */
export namespace WorkoutEquipment {
  /** The imagined support's height when the author names none, a share of the stature (provisional). */
  export const DEFAULT: number = 0.25;

  /** The support's height above the floor. */
  const high = (body: IHumanBody, support: number | undefined): number =>
    support ?? DEFAULT * body.measure.stature;

  /** A straight body on its hands and toes at a pitch, the arms hanging to the hands. */
  const prone =
    (elbow: number, drop: number) =>
    (pitch: number): ExerciseKey.IKey =>
      ExerciseKey.of(
        { pitch, neck: -20 },
        { toes: 70, shoulder: pitch - drop, elbow, wrist: -90 },
      );

  /** A wrist's height over a laid palm. */
  const laid = (body: IHumanBody): number =>
    AutoMovieMotionHumanPlaced.wrist(body, "left", {
      point: { x: 0, y: 0, z: 0 },
      facing: { x: 0, y: -1, z: 0 },
      forward: { x: 0, y: 0, z: 1 },
    }).y;

  /** The exercises' names. */
  export type Name = "stepUp" | "inclinePushUp" | "declinePushUp";

  /** The exercises. */
  export const KINDS: Readonly<Record<Name, WorkoutKind>> = {
    /** A step-up: the right foot on the box, the body raised over it until that leg is straight, and lowered. */
    stepUp: {
      base: "standing",
      anchor: "bar",
      pin: ["rightFoot"],
      rise: (body: IHumanBody): number => body.measure.ankleHeight,
      supports: [{ part: "rightFoot", kind: "plant" }],
      enter: 1,
      reps: 5,
      route: (body: IHumanBody, support?: number): WorkoutKind.IStep[] => {
        // The knee that lifts the foot by the box's height over an upright
        // shank, the other leg straight to the floor.
        const bent: number =
          (Math.acos(
            Math.max(
              0,
              Math.min(1, 1 - high(body, support) / body.measure.thigh),
            ),
          ) *
            180) /
          Math.PI;
        return [
          WorkoutKind.step(
            ExerciseKey.of({}, { elbow: 20 }, {}, { hip: bent, knee: bent }),
            1,
            "lower",
            "down",
          ),
          WorkoutKind.step(
            ExerciseKey.of({}, { elbow: 20 }, { hip: 15, knee: 30 }, {}),
            1,
            "step",
            "up",
            0.3,
          ),
        ];
      },
    },

    /** An incline push-up: the hands on the bench, the toes on the floor. */
    inclinePushUp: {
      base: "leaning",
      anchor: "bar",
      pin: ["leftHand", "rightHand"],
      rise: laid,
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant" },
      ],
      enter: 1.5,
      reps: 5,
      route: (body: IHumanBody, support?: number): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          WorkoutFloor.pitched(
            body,
            high(body, support) +
              WorkoutFloor.REACH *
                (body.measure.upperArm + body.measure.forearm),
            prone(5, 0),
          ),
          1,
          "press",
          "top",
        ),
        WorkoutKind.step(
          WorkoutFloor.pitched(
            body,
            high(body, support) + body.measure.forearm,
            prone(100, 60),
          ),
          1,
          "lower",
          "bottom",
        ),
      ],
    },

    /** A decline push-up: the toes on the bench, the hands on the floor. */
    declinePushUp: {
      base: "leaning",
      anchor: "bar",
      pin: ["leftToes", "rightToes"],
      rise: (body: IHumanBody): number => body.measure.ankleHeight / 4,
      hands: true,
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant" },
        { part: "leftFoot", kind: "plant" },
        { part: "rightFoot", kind: "plant" },
      ],
      enter: 1.5,
      reps: 5,
      route: (body: IHumanBody, support?: number): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          WorkoutFloor.pitched(
            body,
            WorkoutFloor.REACH *
              (body.measure.upperArm + body.measure.forearm) -
              high(body, support),
            prone(5, 0),
          ),
          1,
          "press",
          "top",
        ),
        WorkoutKind.step(
          WorkoutFloor.pitched(
            body,
            body.measure.forearm - high(body, support),
            prone(100, 60),
          ),
          1,
          "lower",
          "bottom",
        ),
      ],
    },
  };
}
