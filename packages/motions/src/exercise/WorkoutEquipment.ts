import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { ExerciseKey } from "./ExerciseKey";
import { WorkoutFloor } from "./WorkoutFloor";
import { WorkoutKind } from "./WorkoutKind";

/**
 * The exercises of the workout law that are done on a box or a bench the
 * author names (`on`): the step-up, the incline push-up (the hands on the
 * bench), the decline push-up (the feet on it) and the hip thrust (the
 * upper back on its edge).
 *
 * Each solves its angles from the support's own height: a step-up's knee
 * bends as far as lifts the foot onto the box with the other leg straight,
 * and a push-up's pitch puts the shoulders the arm's reach above the hands
 * with the toes where they bear. A hip thrust's back turns about the chest's
 * joint over the bench's edge: at the lockout the trunk and the
 * thighs are one line over upright shanks, pitched as the edge's height
 * asks, and at the bottom the legs are solved in the sagittal plane onto
 * the same place of the feet. The hip thrust is the one Contreras et al.
 * describe (Journal of Applied Biomechanics 32:254-260, 2016, Methods and
 * Figure 1): the back on a bench about 16 inches high, the feet flat, full
 * hip extension at the top; `RISEN`, `SUNK` and `DROP` are not from it.
 * The part that bears on the prop is pinned
 * on the prop's place; the other is kept by the angles.
 *
 * With no support named, the kind is done on an imagined one a quarter of
 * the stature high, so the row still plans alone.
 *
 * First pass: a step-up stays on the box's edge, the trailing foot hanging
 * beside it, and does not step down the far side; the feet of an incline
 * push-up and the palms' turn of a decline one are the keys', not solved
 * onto the floor; a hip thrust's feet are on their place at the bottom and
 * at the lockout and follow the blend of the angles between, the back does
 * not roll on the edge, and nothing lies across the hips; every angle not
 * solved is provisional (NSCA's Essentials
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

  /** The highest a step-up's thigh is raised, degrees of hip flexion (provisional): a box that needs more is refused. */
  export const STEP: number = 120;

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

  /** The joint a hip thrust's back turns about. */
  const BACK: readonly AutoMovieHumanoidBone[] = ["chest"];

  /** The hip joints. */
  const HIPS: readonly AutoMovieHumanoidBone[] = [
    "leftUpperLeg",
    "rightUpperLeg",
  ];

  /** The most a hip thrust's lockout raises the hips above the line level with the back's joint, degrees (provisional): a lower edge is refused. */
  export const RISEN: number = 10;

  /** The most a hip thrust's lockout leaves the hips below that line, degrees (provisional): a higher edge is refused. */
  export const SUNK: number = 45;

  /** How far a hip thrust's trunk turns down from the lockout to the bottom, degrees (provisional), less where the hips would reach the floor. */
  export const DROP: number = 30;

  /** The body lying flat on its back, its root at the origin, heading along `+Z`. */
  const flat = (): IHumanPosture =>
    ExerciseKey.posed(ExerciseKey.of({ pitch: -90 }, {}), 0);

  /** How high the back's joint is above what the back lies on. */
  const backed = (body: IHumanBody): number =>
    knockdown.rest(body, flat()) + ExerciseKey.mean(body, flat(), BACK).y;

  /** Degrees to radians. */
  const rad = (degrees: number): number => (degrees * Math.PI) / 180;

  /** Radians to degrees. */
  const deg = (radians: number): number => (radians * 180) / Math.PI;

  /**
   * A hip thrust's two postures on a body and an edge: the bottom, then the
   * lockout.
   *
   * In the sagittal plane, from the back's joint toward the feet: the hip
   * joints are the lying body's own offset turned down by the trunk's
   * angle; at the lockout the thighs continue the trunk and the shanks are
   * upright, so the angle is the one that puts the ankles at their standing
   * height; at the bottom the trunk is turned further down and the two-link
   * leg is solved from the hip joints onto the lockout's ankles.
   */
  const thrust = (
    body: IHumanBody,
    support: number | undefined,
  ): ExerciseKey.IKey[] => {
    const lying: IHumanPosture = flat();
    const pivot: IAutoMovieVector3 = ExerciseKey.mean(body, lying, BACK);
    const hip: IAutoMovieVector3 = ExerciseKey.mean(body, lying, HIPS);
    const along: number = Math.abs(hip.z - pivot.z);
    const up: number = hip.y - pivot.y;
    const thigh: number = body.measure.thigh;
    const shank: number = body.measure.shank;
    const edge: number = high(body, support);
    const top: number = edge + backed(body);
    // The hip joints from the back's joint with the trunk turned down.
    const hips = (angle: number): { forth: number; up: number } => ({
      forth: along * Math.cos(rad(angle)) + up * Math.sin(rad(angle)),
      up: -along * Math.sin(rad(angle)) + up * Math.cos(rad(angle)),
    });
    // The ankles above their standing height at a lockout of that angle.
    const over = (angle: number): number =>
      top +
      hips(angle).up -
      thigh * Math.sin(rad(angle)) -
      shank -
      body.measure.ankleHeight;
    if (over(-RISEN) < 0 || over(SUNK) > 0)
      throw new HumanRefusal({
        kind: "reach",
        axis: "on",
        value: edge,
        feasible: {
          kind: "range",
          minimum: edge - over(-RISEN),
          maximum: edge - over(SUNK),
          unit: "m",
        },
        reason: `the edge is ${edge.toFixed(3)} m high, and this body's lockout over upright shanks needs one between ${(edge - over(-RISEN)).toFixed(3)} m and ${(edge - over(SUNK)).toFixed(3)} m`,
        fix: "lean on a bench or a box whose top is about as high as this body's knee",
      });
    let low: number = -RISEN;
    let highest: number = SUNK;
    for (let i: number = 0; i < 40; i++) {
      const middle: number = (low + highest) / 2;
      if (over(middle) > 0) low = middle;
      else highest = middle;
    }
    const locked: number = (low + highest) / 2;
    const feet: { forth: number; up: number } = {
      forth: hips(locked).forth + thigh * Math.cos(rad(locked)),
      up: hips(locked).up - thigh * Math.sin(rad(locked)) - shank,
    };

    // The bottom: the trunk turned further down, the hip joints kept as
    // high above the floor as when the body lies on it.
    let sunk: number = locked + DROP;
    while (sunk > locked && top + hips(sunk).up < backed(body) + up) sunk -= 1;
    const from: { forth: number; up: number } = hips(sunk);
    const reach: number = Math.min(
      thigh + shank,
      Math.hypot(feet.forth - from.forth, feet.up - from.up),
    );
    const raised: number =
      deg(Math.atan2(feet.up - from.up, feet.forth - from.forth)) +
      deg(
        Math.acos(
          (thigh * thigh + reach * reach - shank * shank) / (2 * thigh * reach),
        ),
      );
    const knee: number =
      180 -
      deg(
        Math.acos(
          (thigh * thigh + shank * shank - reach * reach) / (2 * thigh * shank),
        ),
      );
    return [
      ExerciseKey.of(
        { pitch: -90 + sunk },
        {
          hip: raised + sunk,
          knee,
          ankle: -(raised - knee + 90),
          elbow: 30,
        },
      ),
      ExerciseKey.of({ pitch: -90 + locked }, { knee: 90 - locked, elbow: 30 }),
    ];
  };

  /** The exercises' names. */
  export type Name = "stepUp" | "inclinePushUp" | "declinePushUp" | "hipThrust";

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
        // The hip and knee that lift the foot by the box's height over an
        // upright shank, the other leg straight to the floor: past a level
        // thigh the knee rises above the hip, up to `STEP` degrees.
        const height: number = high(body, support);
        const reach: number =
          body.measure.thigh * (1 - Math.cos((STEP * Math.PI) / 180));
        if (height > reach)
          throw new HumanRefusal({
            kind: "reach",
            axis: "on",
            value: height,
            feasible: { kind: "range", minimum: 0, maximum: reach, unit: "m" },
            reason: `the box's top is ${height.toFixed(3)} m high, above the ${reach.toFixed(3)} m this body's foot is lifted to with the thigh ${STEP} degrees up`,
            fix: "step onto a lower box, or a lower face of this one",
          });
        const bent: number =
          (Math.acos(1 - height / body.measure.thigh) * 180) / Math.PI;
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

    /** A hip thrust: the upper back on the bench's edge, the feet on the floor, the hips driven up until the trunk and the thighs are one line, held half a second, and lowered. */
    hipThrust: {
      base: "lying",
      anchor: "bar",
      pin: BACK,
      rise: backed,
      supports: [
        { part: "back", kind: "lie" },
        { part: "leftFoot", kind: "plant" },
        { part: "rightFoot", kind: "plant" },
      ],
      enter: 2.4,
      reps: 5,
      route: (body: IHumanBody, support?: number): WorkoutKind.IStep[] => {
        const keys: ExerciseKey.IKey[] = thrust(body, support);
        return [
          WorkoutKind.step(keys[0]!, 1, "lower", "down"),
          WorkoutKind.step(keys[1]!, 1, "thrust", "lockout", 0.5),
        ];
      },
    },
  };
}
