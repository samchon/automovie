import type { IHumanBody } from "../body/IHumanBody";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";

/**
 * The floor exercises of the workout law (#3378): those done on the hands
 * and toes (push-up, plank, mountain climber, burpee, downward dog, cobra),
 * lying on the back (sit-up, crunch, glute bridge, a partner's hamstring
 * stretch), on a side (side plank), sitting on the floor (the forward fold
 * and the hurdler's stretch) and on furniture as high as the body needs (the
 * bench press, the rowing machine, the stationary bicycle).
 *
 * A prone support's pitch is solved on the body: the shoulders stand a share
 * of the arm's length above the floor over the toes (`plank`). Every other
 * angle is provisional, read off the exercise's usual description (ACSM's
 * Guidelines, 11th ed.; NSCA's Essentials of Strength Training, 4th ed.).
 *
 * First pass: the bench, the rower's seat and rail and the bicycle are not
 * props, so nothing is shown under the body; a barbell is not held (a hand
 * that holds a prop is refused by the performance while the law drives it);
 * a bridge's shoulders and a side plank's forearm are kept by the angles
 * alone and may slide by the difference between the keys.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, what is solved, what is provisional with its sources and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One `WorkoutKind` per exercise: data over the one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table and the one solved angle it shares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres; heights and pitches follow from the body's measure.
 */
export namespace WorkoutFloor {
  /** The share of the straight arm's length the shoulders stand above the floor in a plank (provisional): the elbows a little soft. */
  export const REACH: number = 0.95;

  /** The shoulders' height at a push-up's bottom, a share of the stature (provisional): the chest clear of the floor. */
  export const CHEST: number = 0.09;

  /**
   * The whole-body pitch of a straight body on its toes with the shoulders
   * at a height.
   *
   * @param body The body.
   * @param height The shoulders' height above the floor, metres.
   * @returns Degrees; 90 is level.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and what 90 means.
   * @evidence contracts/development/implementation.md#principled-implementation The body from the ankles to the shoulders is a straight line of the standing length between them, raised at its shoulder end by the height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arcsine.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The toes' own height is neglected against the body's length, so the palms are laid by the arm's solve and not by this angle.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function plank(body: IHumanBody, height: number): number {
    const length: number =
      body.measure.shoulderHeight - body.measure.ankleHeight;
    return 90 - (Math.asin(Math.min(1, height / length)) * 180) / Math.PI;
  }

  /** The top of a push-up: a straight body on the toes and the straight arms; the hands `raise` degrees out. */
  const top = (body: IHumanBody, raise: number = 5): ExerciseKey.IKey => {
    const pitch: number = plank(
      body,
      REACH * (body.measure.upperArm + body.measure.forearm),
    );
    return ExerciseKey.of(
      { pitch, neck: -20 },
      { toes: 70, shoulder: pitch, raise, elbow: 5 },
    );
  };

  /** The bottom of a push-up: the same line lowered until the chest clears the floor. */
  const bottom = (body: IHumanBody, raise: number = 5): ExerciseKey.IKey => {
    const pitch: number = plank(body, CHEST * body.measure.stature);
    return ExerciseKey.of(
      { pitch, neck: -25 },
      { toes: 70, shoulder: pitch - 60, raise, elbow: 100 },
    );
  };

  /** Hook lying: on the back, the knees bent and the feet flat. */
  const hook = (arms: ExerciseKey.ILimb): ExerciseKey.IKey =>
    ExerciseKey.of({ pitch: -90 }, { hip: 45, knee: 90, ankle: -45, ...arms });

  /** Sitting on the floor with the legs straight ahead. */
  const longSit: ExerciseKey.IKey = ExerciseKey.of(
    {},
    { hip: 90, shoulder: 30, elbow: 20 },
  );

  /** The hands and the toes bear. */
  const PRONE: readonly WorkoutKind.ISupport[] = [
    { part: "leftHand", kind: "plant" },
    { part: "rightHand", kind: "plant" },
    { part: "leftFoot", kind: "plant" },
    { part: "rightFoot", kind: "plant" },
  ];

  /** The back bears. */
  const SUPINE: readonly WorkoutKind.ISupport[] = [
    { part: "back", kind: "lie" },
  ];

  /** The seat bears. */
  const SEATED: readonly WorkoutKind.ISupport[] = [
    { part: "seat", kind: "seat" },
  ];

  /** The exercises' names. */
  export type Name =
    | "pushUp"
    | "widePushUp"
    | "plank"
    | "mountainClimber"
    | "burpee"
    | "downwardDog"
    | "cobra"
    | "sitUp"
    | "crunch"
    | "gluteBridge"
    | "pnfHamstring"
    | "sidePlank"
    | "seatedFold"
    | "hurdlerStretch"
    | "benchPress"
    | "rowing"
    | "cycling";

  /** The exercises. */
  export const KINDS: Readonly<Record<Name, WorkoutKind>> = {
    /** A push-up: 1 s down, 1 s up (provisional). */
    pushUp: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftToes", "rightToes"],
      hands: true,
      supports: PRONE,
      enter: 1.5,
      reps: 5,
      route: (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.step(top(body), 1, "press", "top"),
        WorkoutKind.step(bottom(body), 1, "lower", "bottom"),
      ],
    },

    /** A wide push-up: the hands 30 degrees out (provisional). */
    widePushUp: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftToes", "rightToes"],
      hands: true,
      supports: PRONE,
      enter: 1.5,
      reps: 5,
      route: (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.step(top(body, 30), 1, "press", "top"),
        WorkoutKind.step(bottom(body, 30), 1, "lower", "bottom"),
      ],
    },

    /** A plank on the straight arms, held 30 s. */
    plank: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftToes", "rightToes"],
      hands: true,
      supports: PRONE,
      enter: 1.5,
      reps: 1,
      route: (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.pose(top(body), 0, 30),
      ],
    },

    /** A mountain climber: from the plank, one knee driven to the chest, alternating; the hands bear and stay. */
    mountainClimber: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftHand", "rightHand"],
      hands: true,
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant" },
      ],
      alternate: true,
      enter: 1.5,
      reps: 8,
      route: (body: IHumanBody): WorkoutKind.IStep[] => {
        const up: ExerciseKey.IKey = top(body);
        return [
          WorkoutKind.step(up, 0.3, "back", "extended"),
          WorkoutKind.step(
            ExerciseKey.of(
              { pitch: up.pitch, neck: -20 },
              { toes: 70, shoulder: up.pitch, elbow: 5 },
              {},
              { hip: 100, knee: 110, toes: 0 },
            ),
            0.3,
            "drive",
            "kneeIn",
          ),
        ];
      },
    },

    /** A burpee without its jump: a crouch on the hands, the feet shot back to the plank and brought in again. */
    burpee: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftHand", "rightHand"],
      hands: true,
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant" },
      ],
      enter: 0.8,
      reps: 3,
      route: (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: 60, neck: -30 },
            { hip: 150, knee: 140, ankle: 25, toes: 30, shoulder: 60, elbow: 5 },
          ),
          0.4,
          "feetIn",
          "crouched",
        ),
        WorkoutKind.step(top(body), 0.4, "feetBack", "plank", 0.3),
      ],
    },

    /** The downward dog of yoga: the hips high over the flat feet and the hands, held 15 s (provisional). */
    downwardDog: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftFoot", "rightFoot"],
      hands: true,
      supports: PRONE,
      enter: 2,
      reps: 1,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.pose(
          ExerciseKey.of(
            { pitch: 140, neck: 10 },
            { hip: 105, ankle: 35, shoulder: 175, elbow: 3 },
          ),
          0,
          15,
        ),
      ],
    },

    /** The cobra of yoga: lying face down, the chest raised over the hands, held 10 s (provisional). */
    cobra: {
      base: "lying",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      hands: true,
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "rightHand", kind: "plant" },
      ],
      enter: 2.4,
      reps: 1,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: 88, neck: -10 },
            { ankle: -45, shoulder: -10, raise: 20, elbow: 140 },
          ),
          1.5,
          "lower",
          "prone",
        ),
        WorkoutKind.pose(
          ExerciseKey.of(
            { pitch: 78, spine: [-20, 0, 0], chest: [-20, 0, 0], neck: -25 },
            { hip: -10, ankle: -45, shoulder: -10, raise: 20, elbow: 140 },
          ),
          1.5,
          10,
        ),
      ],
    },

    /** A sit-up: from hook lying, the trunk raised to the knees, 1 s each way (provisional). */
    sitUp: {
      base: "lying",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      supports: SEATED,
      enter: 2.4,
      reps: 5,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          hook({ shoulder: 30, elbow: 130 }),
          1,
          "lower",
          "down",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -25, spine: [15, 0, 0] },
            { hip: 110, knee: 90, ankle: -45, shoulder: 30, elbow: 130 },
          ),
          1,
          "curl",
          "up",
        ),
      ],
    },

    /** A crunch: from hook lying, the shoulders curled off the floor. */
    crunch: {
      base: "lying",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      supports: SUPINE,
      enter: 2.4,
      reps: 8,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          hook({ shoulder: 30, elbow: 130 }),
          0.8,
          "lower",
          "down",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -90, spine: [25, 0, 0], chest: [25, 0, 0], neck: 20 },
            { hip: 45, knee: 90, ankle: -45, shoulder: 30, elbow: 130 },
          ),
          0.8,
          "curl",
          "up",
        ),
      ],
    },

    /** A glute bridge: from hook lying, the hips raised until the thighs continue the trunk, over the planted feet. */
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
      reps: 5,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(hook({ elbow: 5 }), 1, "lower", "down"),
        WorkoutKind.step(
          ExerciseKey.of(
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

    /** A partner's hamstring stretch, the stretched person's part: on the back, the right leg raised straight and held 20 s; the helper's hands are a `touch` on the calf. */
    pnfHamstring: {
      base: "lying",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      supports: SUPINE,
      enter: 2.4,
      reps: 1,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of({ pitch: -90 }, { ankle: -20, elbow: 5 }),
          1.5,
          "lower",
          "down",
        ),
        WorkoutKind.pose(
          ExerciseKey.of({ pitch: -90 }, { ankle: -20, elbow: 5 }, {}, {
            hip: 80,
            ankle: 0,
          }),
          1.5,
          20,
        ),
      ],
    },

    /** A side plank on the left forearm and the feet, held 20 s (provisional angles). */
    sidePlank: {
      base: "leaning",
      anchor: "hips",
      pin: ["leftFoot", "rightFoot"],
      supports: [
        { part: "leftHand", kind: "plant" },
        { part: "leftFoot", kind: "plant" },
      ],
      enter: 2.4,
      reps: 1,
      route: (body: IHumanBody): WorkoutKind.IStep[] => [
        WorkoutKind.pose(
          ExerciseKey.of(
            { roll: -plank(body, body.measure.upperArm) },
            { raise: 0, elbow: 5 },
            { raise: 80, elbow: 90 },
            { spread: -9 },
          ),
          0,
          20,
        ),
      ],
    },

    /** The seated forward fold: from sitting with the legs straight, the trunk folded over them, held 20 s. */
    seatedFold: {
      base: "seated",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      supports: SEATED,
      enter: 2,
      reps: 1,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(longSit, 1.5, "sitUp", "sitting"),
        WorkoutKind.pose(
          ExerciseKey.of(
            { pitch: 35, spine: [20, 0, 0], chest: [15, 0, 0], neck: 10 },
            { hip: 125, shoulder: 95, elbow: 5 },
          ),
          1.5,
          20,
        ),
      ],
    },

    /** The hurdler's hamstring stretch: sitting, the left knee bent out, the trunk folded over the straight right leg, held 20 s. */
    hurdlerStretch: {
      base: "seated",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      supports: SEATED,
      enter: 2,
      reps: 1,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(longSit, 1.5, "sitUp", "sitting"),
        WorkoutKind.pose(
          ExerciseKey.of(
            { pitch: 30, spine: [20, 0, 0], chest: [10, 0, 0] },
            { hip: 120, shoulder: 90, elbow: 5 },
            { spread: 45, knee: 130 },
          ),
          1.5,
          20,
        ),
      ],
    },

    /** A bench press without its bar: on the back at the height of the knees, the feet on the floor, the arms pressed up and lowered. */
    benchPress: {
      base: "lying",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      raise: (body: IHumanBody): number =>
        body.measure.shank + body.measure.ankleHeight,
      supports: SUPINE,
      enter: 2.4,
      reps: 5,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -90 },
            { knee: 90, shoulder: 90, raise: 0, elbow: 3 },
          ),
          1,
          "press",
          "lockout",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -90 },
            { knee: 90, shoulder: 15, raise: 70, elbow: 95 },
          ),
          1.5,
          "lower",
          "chest",
        ),
      ],
    },

    /** A rowing stroke on a machine: the feet fixed, the seat a third of the shank high (provisional); the catch and the finish. */
    rowing: {
      base: "seated",
      anchor: "hips",
      pin: ["leftFoot", "rightFoot"],
      raise: (body: IHumanBody): number => body.measure.shank / 3,
      supports: [
        { part: "seat", kind: "seat" },
        { part: "leftFoot", kind: "plant" },
        { part: "rightFoot", kind: "plant" },
      ],
      enter: 2,
      reps: 5,
      route: (): WorkoutKind.IStep[] => [
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: 15 },
            { hip: 125, knee: 110, ankle: 15, shoulder: 80, elbow: 3 },
          ),
          1.4,
          "recover",
          "catch",
        ),
        WorkoutKind.step(
          ExerciseKey.of(
            { pitch: -15 },
            { hip: 75, knee: 10, ankle: -15, shoulder: -15, elbow: 110 },
          ),
          0.8,
          "drive",
          "finish",
        ),
      ],
    },

    /** Pedalling a stationary bicycle: on a saddle the height of the leg less a tenth (provisional), one leg down as the other comes up. */
    cycling: {
      base: "seated",
      anchor: "hips",
      pin: ["leftUpperLeg", "rightUpperLeg"],
      raise: (body: IHumanBody): number =>
        0.9 * (body.measure.thigh + body.measure.shank),
      supports: SEATED,
      enter: 2,
      reps: 8,
      route: (): WorkoutKind.IStep[] => {
        const pedal = (down: "left" | "right"): ExerciseKey.IKey => {
          const low: ExerciseKey.ILimb = { hip: 60, knee: 30 };
          const high: ExerciseKey.ILimb = { hip: 110, knee: 105 };
          return ExerciseKey.of(
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
}
