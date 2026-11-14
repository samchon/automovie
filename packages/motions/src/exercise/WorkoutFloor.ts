import { physicalShapeBounds } from "@automovie/engine";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";

/**
 * The exercises of the workout law done on the hands and the toes or feet
 * (#3378): the push-up, the plank, the mountain climber, the burpee, the
 * downward dog and the cobra.
 *
 * A prone support's pitch is solved on the body: the shoulders stand a share
 * of the arm's length above the floor over the toes (`plank`). Every other
 * angle is provisional, read off the exercise's usual description (ACSM's
 * Guidelines, 11th ed.; NSCA's Essentials of Strength Training, 4th ed.).
 *
 * First pass: the palms are laid where the first posture's angles put the
 * hands, so a body whose proportions differ from the keys' shows it in the
 * elbows; a burpee has no jump.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, what is solved, what is provisional with its sources and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation One `WorkoutKind` per exercise: data over the one planner.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The table and the one solved angle it shares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No length in metres; heights and pitches follow from the body's measure.
 */
export namespace WorkoutFloor {
  /** The share of the straight arm's length the shoulders stand above the floor in a plank (provisional): the elbows a little soft. */
  export const REACH: number = 0.95;

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

  /**
   * The key of a family of keys by pitch whose shoulders stand a height
   * above its toes' joints.
   *
   * @param body The body.
   * @param height The shoulders' height above the toes' joints, metres.
   * @param key The key at a pitch, degrees.
   * @returns The key whose pitch gives that height.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The height is read by forward kinematics of the key itself, feet and toes included, so the foot stood on its toes raises the ankles as it does on the body; the first pass measured 0.2 m of error from treating the body as a line from the ankles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bisection over the pitch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The pitch is sought between 10 degrees (nearly upright, the hands on something high) and 150 (the head lower than the feet, the feet on something high); a height outside what that range gives ends at the nearer end.
   * @evidence contracts/development/implementation.md#efficient-algorithms Twenty forward kinematics per key, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pitched(
    body: IHumanBody,
    height: number,
    key: (pitch: number) => ExerciseKey.IKey,
  ): ExerciseKey.IKey {
    const above = (pitch: number): number => {
      const posed: IHumanPosture = ExerciseKey.posed(key(pitch), 0);
      return (
        ExerciseKey.mean(body, posed, ["leftUpperArm", "rightUpperArm"]).y -
        ExerciseKey.mean(body, posed, ["leftToes", "rightToes"]).y
      );
    };
    let steep: number = 10;
    let level: number = 150;
    for (let i: number = 0; i < 20; i++) {
      const middle: number = (steep + level) / 2;
      if (above(middle) > height) steep = middle;
      else level = middle;
    }
    return key((steep + level) / 2);
  }

  /**
   * The key of a family of keys by roll that rests on its side on two
   * supports at once: the roll at which the lowest point of the `on`
   * colliders lies level with the lowest point of the `with` colliders, as
   * a side plank lies on its forearm and its feet.
   *
   * @param body The body.
   * @param on The bones that bear besides the feet, such as a forearm and its hand.
   * @param key The key at a roll, degrees; negative tips the body to its left.
   * @returns The key at that roll.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is solved, the inputs, the sign and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A body on two supports rests on both, so the roll is the one that puts both on the floor, read by forward kinematics of the key on the body's own colliders, the reading the floor audit makes; a straight line from the feet to the shoulder, as `plank` models a prone support, leaves the forearm's thickness and the hand's place out.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bisection over the roll.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The roll is sought between upright and lying on the side; a support that cannot reach the floor in that range ends at the nearer end.
   * @evidence contracts/development/implementation.md#efficient-algorithms Twenty forward kinematics per key, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rolled(
    body: IHumanBody,
    on: RegExp,
    key: (roll: number) => ExerciseKey.IKey,
  ): ExerciseKey.IKey {
    // How far the bearing bones' lowest point lies above the feet's.
    const above = (roll: number): number => {
      const posed: IHumanPosture = ExerciseKey.posed(key(roll), 0);
      let bearing: number = Infinity;
      let feet: number = Infinity;
      for (const segment of HumanColliders.placed(
        body,
        poseBones(body, resolveHumanPosture(body, posed)),
      ))
        for (const shape of segment.shapes) {
          const low: number = physicalShapeBounds(segment.pose, shape).min.y;
          if (on.test(segment.bone)) bearing = Math.min(bearing, low);
          if (/(Foot|Toes)$/.test(segment.bone)) feet = Math.min(feet, low);
        }
      return bearing - feet;
    };
    let upright: number = 0;
    let side: number = -90;
    for (let i: number = 0; i < 20; i++) {
      const middle: number = (upright + side) / 2;
      if (above(middle) > 0) upright = middle;
      else side = middle;
    }
    return key((upright + side) / 2);
  }

  /** The top of a push-up: a straight body on the toes and the straight arms; the hands `raise` degrees out. */
  const top = (body: IHumanBody, raise: number = 5): ExerciseKey.IKey =>
    pitched(
      body,
      REACH * (body.measure.upperArm + body.measure.forearm),
      (pitch: number): ExerciseKey.IKey =>
        ExerciseKey.of(
          { pitch, neck: -20 },
          { toes: 70, shoulder: pitch, raise, elbow: 5, wrist: -90 },
        ),
    );

  /** The bottom of a push-up: the same line lowered until the upper arms are level, the shoulders at the elbows' height over upright forearms (NSCA's description of the bottom position). */
  const bottom = (body: IHumanBody, raise: number = 5): ExerciseKey.IKey =>
    pitched(
      body,
      body.measure.forearm,
      (pitch: number): ExerciseKey.IKey =>
        ExerciseKey.of(
          { pitch, neck: -25 },
          { toes: 70, shoulder: pitch - 60, raise, elbow: 100, wrist: -90 },
        ),
    );

  /** The hands and the toes bear. */
  const PRONE: readonly WorkoutKind.ISupport[] = [
    { part: "leftHand", kind: "plant" },
    { part: "rightHand", kind: "plant" },
    { part: "leftFoot", kind: "plant" },
    { part: "rightFoot", kind: "plant" },
  ];

  /** The exercises' names. */
  export type Name =
    | "pushUp"
    | "widePushUp"
    | "plank"
    | "mountainClimber"
    | "burpee"
    | "downwardDog"
    | "cobra";

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
              { toes: 70, shoulder: up.pitch, elbow: 5, wrist: -90 },
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
            {
              hip: 150,
              knee: 140,
              ankle: 25,
              toes: 30,
              shoulder: 60,
              elbow: 5,
              wrist: -70,
            },
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
            { hip: 105, ankle: 35, shoulder: 175, elbow: 3, wrist: -50 },
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
            { ankle: -45, shoulder: -10, raise: 20, elbow: 140, wrist: -80 },
          ),
          1.5,
          "lower",
          "prone",
        ),
        WorkoutKind.pose(
          ExerciseKey.of(
            { pitch: 78, spine: [-20, 0, 0], chest: [-20, 0, 0], neck: -25 },
            {
              hip: -10,
              ankle: -45,
              shoulder: -10,
              raise: 20,
              elbow: 140,
              wrist: -80,
            },
          ),
          1.5,
          10,
        ),
      ],
    },
  };
}
