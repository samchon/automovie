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
import { ReactionFeet } from "./ReactionFeet";
import { ReactionSource } from "./ReactionSource";

/**
 * A struck body thrown clear of the floor by a blast or a jerk-back
 * (`IAutoMovieMotionHumanThrown`). The body takes its rig's shape over `WINDUP`
 * with the feet held flat where they stood, the feet leave the floor at
 * `takeoff`, and the root flies the ballistic path of the authored distance and
 * height under standard gravity until it reaches the height it lies at, `land`,
 * turning over onto its back meanwhile into the knockdown's supine lie
 * (`KnockdownFloor`). The body faces against its travel, so it lands on its
 * back.
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

  /**
   * How long the rig's shape takes before the feet leave, seconds: provisional,
   * about a reaction time of the rig.
   */
  export const WINDUP: number = 0.1;

  /**
   * Plan a throw.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `distance` or `height` when not positive and
   *   finite, and on `seconds` when negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanThrown.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const { distance, height } = context.params;
    const lie: number = context.params.hold ?? 1;
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
        axis: "hold",
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
        context.params.target,
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
    const shape: KnockdownFloor.IFold = SHAPES[rig];

    // A named wall in the path stops the flight where the back meets its
    // face; the body then slides down it, braked to half of gravity, to sit
    // on the floor against it.
    const wall: ReturnType<typeof context.aim> | undefined =
      context.params.wall === undefined
        ? undefined
        : context.aim(context.params.wall, context.start);
    // The body faces against its travel and leans back into it, so what
    // meets the wall first is the back at the trunk's lean: the back's half
    // depth behind the root plus the head's height laid along the travel by
    // the flight's pitch, the pitch it would have flown with.
    const back: number = body.measure.chestDepth / 2;
    const closing: number =
      wall === undefined ? 0 : speed * Vector3.dot(travel, wall.normal);
    const leading: (t: number) => number = (t: number): number => {
      const pitch: number =
        shape.pitch + (lying.pitch - shape.pitch) * Math.min(1, t / flight);
      return (
        back +
        HEAD *
          body.measure.stature *
          Math.max(0, Math.sin((-pitch * Math.PI) / 180))
      );
    };
    const reach: number = ((): number => {
      if (wall === undefined || !(closing < 0)) return Infinity;
      const d0: number = Vector3.dot(
        Vector3.subtract(entry.root, wall.point),
        wall.normal,
      );
      const gap: (t: number) => number = (t: number): number =>
        d0 + closing * t - leading(t);
      if (gap(0) <= 0) return 0;
      const steps: number = 200;
      for (let k: number = 1; k <= steps; ++k) {
        const t: number = (flight * k) / steps;
        if (gap(t) > 0) continue;
        // Refine between the last open sample and this one.
        let lo: number = (flight * (k - 1)) / steps;
        let hi: number = t;
        for (let n: number = 0; n < 30; ++n) {
          const mid: number = (lo + hi) / 2;
          if (gap(mid) > 0) lo = mid;
          else hi = mid;
        }
        return hi;
      }
      return Infinity;
    })();
    const struck: boolean = reach > 0 && reach < flight;
    const flown: number = struck ? reach : flight;
    const contactHeight: number =
      start + rise * flown - 0.5 * g * flown * flown;
    const sitting: number = body.measure.thighRadius - body.measure.hipHeight;
    const slide: number = struck
      ? Math.sqrt((2 * Math.max(0, contactHeight - sitting)) / (0.5 * g))
      : 0;
    const impact: number = takeoff + flown;
    const land: number = impact + slide;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(land + lie, [
      { name: "takeoff", seconds: takeoff },
      ...(struck ? [{ name: "impact", seconds: impact }] : []),
      { name: "land", seconds: land },
      { name: "stroke", seconds: struck ? impact : land },
    ]);
    const duration: number = clock.duration;
    const blend: (seconds: number) => KnockdownFloor.IFold = (
      seconds: number,
    ): KnockdownFloor.IFold => {
      const a: number = Math.min(1, seconds / takeoff);
      const b: number = Math.min(
        1,
        Math.max(0, (Math.min(seconds, impact) - takeoff) / flight),
      );
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
      const flying: KnockdownFloor.IFold = {
        pitch: a * (shape.pitch + (lying.pitch - shape.pitch) * b),
        joints,
      };
      if (!struck || seconds <= impact) return flying;
      // Against the wall: from the pose it struck in to sitting on the floor.
      const u: number = slide > 0 ? Math.min(1, (seconds - impact) / slide) : 1;
      const at: KnockdownFloor.IFold = blend(impact);
      const out: IAutoMovieMotionHumanJoints.Angles = {};
      for (const bone of new Set([
        ...Object.keys(at.joints),
        ...Object.keys(SITTING.joints),
      ]) as Set<keyof IAutoMovieMotionHumanJoints.Angles>) {
        const p: readonly [number, number, number] = at.joints[bone] ?? [
          0, 0, 0,
        ];
        const q: readonly [number, number, number] = SITTING.joints[bone] ?? [
          0, 0, 0,
        ];
        out[bone] = [
          p[0] + (q[0] - p[0]) * u,
          p[1] + (q[1] - p[1]) * u,
          p[2] + (q[2] - p[2]) * u,
        ];
      }
      return { pitch: at.pitch + (SITTING.pitch - at.pitch) * u, joints: out };
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
              // The back lies on the floor, or bears on the wall it struck.
              {
                part: "back",
                kind: "lie",
                from: (struck ? impact : land) / duration,
                to: 1,
                support:
                  struck && context.params.wall?.kind === "prop"
                    ? { kind: "prop", subject: context.params.wall.subject }
                    : { kind: "ground" },
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
              const t: number = Math.min(flown, Math.max(0, seconds - takeoff));
              const world: IAutoMovieVector3 = Vector3.scale(travel, speed * t);
              const sliding: number = Math.min(
                slide,
                Math.max(0, seconds - impact),
              );
              const y: number =
                struck && seconds > impact
                  ? Math.max(
                      sitting,
                      contactHeight - 0.25 * g * sliding * sliding,
                    )
                  : start + rise * t - 0.5 * g * t * t;
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
    // The feet stay flat where they stood until they leave the floor.
    return {
      ...ReactionFeet.hold(
        plan,
        context.entry,
        body,
        takeoff,
        0.5 * body.measure.hipHeight,
      ),
      physicalWindow: null,
    };
  }

  /**
   * The head's top above the feet, in statures: the reach of a body laid back
   * along its travel.
   */
  const HEAD: number = 0.95;

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

  /**
   * Sitting on the floor against the wall the flight struck: the hips folded
   * square with the legs out along the floor, the trunk upright against the
   * face (provisional stage reading).
   */
  const SITTING: KnockdownFloor.IFold = {
    pitch: 0,
    joints: {
      leftUpperLeg: [90, 5, 0],
      rightUpperLeg: [90, 5, 0],
      leftLowerLeg: [5, 0, 0],
      rightLowerLeg: [5, 0, 0],
      leftUpperArm: [10, 15, 0],
      rightUpperArm: [10, 15, 0],
      neck: [20, 0, 0],
    },
  };

  /** A heading difference wrapped into (-180, 180]. */
  function wrap(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }
}
