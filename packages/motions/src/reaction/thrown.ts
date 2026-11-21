import { AutoMovieGravity, Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanThrown,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { StrikingTarget } from "../striking/StrikingTarget";
import { KnockdownFloor } from "./KnockdownFloor";
import { ReactionSource } from "./ReactionSource";

/**
 * A struck body thrown clear of the floor by a blast or a jerk-back
 * (`IAutoMovieMotionHumanThrown`). The body takes its rig's shape over
 * `WINDUP`, the feet leave the floor at `takeoff`, and the root flies the
 * ballistic path of the authored distance and height under standard gravity
 * until it reaches the height it lies at, `land`, turning over onto its
 * back meanwhile into the knockdown's supine lie (`KnockdownFloor`). The
 * body faces against its travel, so it lands on its back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the ballistic path, the landing pose and the heading.
 * @evidence contracts/development/design.md#principled-representation A registered reaction law whose flight is the closed-form projectile of the authored throw.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law, its wind-up time and the rig shapes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The landing lie is the knockdown's fitted one, never a second copy.
 */
export namespace thrown {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "thrown";

  /** Cancel table: none; a thrown performer lands and lies. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** A throw interrupts whatever the body was doing, at any instant. */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /** How long the rig's shape takes before the feet leave, seconds: provisional, about a reaction time of the rig. */
  export const WINDUP: number = 0.1;

  /**
   * Plan a throw.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `distance` or `height` when not positive and finite, and on `seconds` when negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The projectile p(t) = p0 + v t + g t^2 / 2 with the vertical speed sqrt(2 g h) that rises h and the horizontal speed that covers the distance in the time it takes to fall to the lying height; the shape blends linearly from the rig's to the lie over the flight.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, read the direction, solve the flight time, then evaluate each posture in closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flight comes from the authored distance and height; the lying height is measured on the body.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fit and one measure at plan time; constant work per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the knockdown's lie fit and floor measure.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the flight constants and the two shapes.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanThrown.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const { distance, height } = context.params;
    const lie: number = context.params.seconds ?? 1;
    for (const [axis, value] of [
      ["distance", distance],
      ["height", height],
    ] as const)
      if (!(value > 0) || !Number.isFinite(value))
        throw new HumanRefusal({
          kind: "parameter",
          axis,
          value,
          feasible: {
            kind: "range",
            unit: "m",
            minimum: 0,
            maximum: Number.MAX_VALUE,
          },
          reason: "a throw rises and travels a positive distance",
          fix: `give a positive ${axis} in metres`,
        });
    if (!(lie >= 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "seconds",
        value: lie,
        feasible: {
          kind: "range",
          unit: "s",
          minimum: 0,
          maximum: Number.MAX_VALUE,
        },
        reason: "a thrown body lies a non-negative time",
        fix: "give a non-negative lying time",
      });

    const body: IAutoMovieMotionHumanBody = context.body;
    const rig: IAutoMovieMotionHumanThrown.Rig = context.params.rig ?? "blast";
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;

    // The travel: away from a blast, toward a pulling cable.
    const away: IAutoMovieVector3 = AutoMovieMotionHumanTarget.away(
      ReactionSource.at(
        context,
        context.params.from,
        context.start - StrikingTarget.LOOK,
        entry,
        AutoMovieMotionHumanTarget.DEFAULTS.ahead,
      ),
      entry.root,
      entry.yaw,
    );
    const travel: IAutoMovieVector3 =
      rig === "blast" ? away : Vector3.scale(away, -1);
    const heading: number = (Math.atan2(-travel.x, -travel.z) * 180) / Math.PI;
    const turn: number = wrap(heading - entry.yaw);

    // The lie it lands into, and the height its root lies at.
    const fitted: KnockdownFloor.IFit = KnockdownFloor.fit(body, 1);
    const lying: KnockdownFloor.IFold = KnockdownFloor.fold(fitted, 1, 1);
    const floor: number = KnockdownFloor.prepareMeasure(body)(lying).floor;
    const start: number = entry.root.y;
    const g: number = AutoMovieGravity.STANDARD;
    const rise: number = Math.sqrt(2 * g * height);
    const flight: number =
      (rise + Math.sqrt(rise * rise + 2 * g * (start - floor))) / g;
    const speed: number = distance / flight;
    const takeoff: number = WINDUP;
    const land: number = takeoff + flight;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(land + lie, [
      { name: "takeoff", seconds: takeoff },
      { name: "land", seconds: land },
      { name: "stroke", seconds: land },
    ]);
    const duration: number = clock.duration;
    const shape: KnockdownFloor.IFold = SHAPES[rig];
    const blend = (seconds: number): KnockdownFloor.IFold => {
      const a: number = Math.min(1, seconds / takeoff);
      const b: number = Math.min(1, Math.max(0, (seconds - takeoff) / flight));
      const joints: IAutoMovieMotionHumanJoints.Angles = {};
      for (const bone of Object.keys(
        lying.joints,
      ) as (keyof IAutoMovieMotionHumanJoints.Angles)[]) {
        const from: readonly [number, number, number] = shape.joints[bone] ?? [
          0, 0, 0,
        ];
        const to: readonly [number, number, number] = lying.joints[bone]!;
        joints[bone] = [
          a * (from[0] + (to[0] - from[0]) * b),
          a * (from[1] + (to[1] - from[1]) * b),
          a * (from[2] + (to[2] - from[2]) * b),
        ];
      }
      return {
        pitch: a * (shape.pitch + (lying.pitch - shape.pitch) * b),
        joints,
      };
    };

    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: {
          ...AutoMovieMotionHumanBase.still(
            duration,
            {
              root: entry.root,
              yaw: entry.yaw,
              pitch: 0,
              roll: 0,
              joints: {},
              limbs: {},
            },
            [
              {
                part: "leftFoot",
                kind: "plant",
                from: 0,
                to: takeoff / duration,
                support: { kind: "ground" },
              },
              {
                part: "rightFoot",
                kind: "plant",
                from: 0,
                to: takeoff / duration,
                support: { kind: "ground" },
              },
              {
                part: "back",
                kind: "lie",
                from: land / duration,
                to: 1,
                support: { kind: "ground" },
              },
            ],
          ),
        },
        clock,
        primitives: [
          // The root flies the projectile from take-off and lies where it lands.
          {
            channels: ["root"],
            reads: ["root"],
            from: 0,
            to: duration,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              seconds: number,
              _before?: IAutoMovieMotionHumanPrimitive.Reader,
            ): IAutoMovieMotionHumanPosture => {
              const t: number = Math.min(
                flight,
                Math.max(0, seconds - takeoff),
              );
              const world: IAutoMovieVector3 = Vector3.scale(travel, speed * t);
              const y: number = start + rise * t - 0.5 * g * t * t;
              return AutoMovieMotionHumanRoot.place(posture, {
                point: {
                  ...HumanFrame.local(
                    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
                    world,
                  ),
                  y: y - start,
                },
                yaw: turn * Math.min(1, seconds / takeoff),
              });
            },
          },
          AutoMovieMotionHumanLean.tilt({
            from: 0,
            to: duration,
            angles: (seconds: number): IAutoMovieMotionHumanLean.IAngles => ({
              pitch: blend(seconds).pitch,
              roll: 0,
            }),
          }),
          AutoMovieMotionHumanJoints.add({
            channels: ["head", "leftLeg", "rightLeg", "leftArm", "rightArm"],
            from: 0,
            to: duration,
            delta: (seconds: number): IAutoMovieMotionHumanJoints.Angles =>
              blend(seconds).joints,
          }),
        ],
      });
    return { ...plan, physicalWindow: null };
  }

  /**
   * Each rig's take-off shape, degrees (provisional stage readings): a
   * jerk-back folds the hips and leans the trunk over the pulled pelvis; a
   * blast extends the body away, the arms flung out.
   */
  const SHAPES: Readonly<
    Record<IAutoMovieMotionHumanThrown.Rig, KnockdownFloor.IFold>
  > = {
    jerkBack: {
      pitch: 35,
      joints: {
        leftUpperLeg: [60, 5, 0],
        rightUpperLeg: [60, 5, 0],
        leftLowerLeg: [20, 0, 0],
        rightLowerLeg: [20, 0, 0],
        leftUpperArm: [60, 10, 0],
        rightUpperArm: [60, 10, 0],
        leftLowerArm: [20, 0, 0],
        rightLowerArm: [20, 0, 0],
      },
    },
    blast: {
      pitch: -15,
      joints: {
        leftUpperLeg: [-5, 10, 0],
        rightUpperLeg: [-5, 10, 0],
        leftLowerLeg: [10, 0, 0],
        rightLowerLeg: [10, 0, 0],
        leftUpperArm: [20, 70, 0],
        rightUpperArm: [20, 70, 0],
        leftLowerArm: [15, 0, 0],
        rightLowerArm: [15, 0, 0],
      },
    },
  };

  /** A heading difference wrapped into (-180, 180]. */
  function wrap(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }
}
