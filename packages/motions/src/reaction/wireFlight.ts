import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanWireFlight,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRoot } from "../compose/AutoMovieMotionHumanRoot";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { mixHumanPosture } from "../posture/mixHumanPosture";

/**
 * A wire flight along an authored path (`IAutoMovieMotionHumanWireFlight`).
 * The root moves along the polyline from the entry root through the
 * waypoints to the end by arc length on one minimum-jerk profile (Flash and
 * Hogan 1985), so it starts and ends at rest, and the shape blends in over
 * the first quarter of the flight and out over the last. The heading turns
 * to the horizontal travel of the whole path. No gravity is checked: the
 * flight is staged on wires.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path, the profile, the shape blend and the heading.
 * @evidence contracts/development/design.md#principled-representation A registered law whose root is a closed-form function of time along the authored polyline.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law and its shape table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The path is the author's; the law adds no gravity or fitted curve.
 */
export namespace wireFlight {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "wireFlight";

  /** Cancel table: none; a flight runs to its end. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /**
   * Plan a wire flight.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On `seconds` when not positive and finite, and on `to` when the path has no length.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The arc length s(t) = L * minimumJerk(t / T) placed on the polyline's segments; the shape blends by the same profile at each end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, build the polyline, then evaluate each posture in closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A flight with no length or time is refused, never stretched.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the waypoints at plan time; a scan of the segments per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each plan owns its own polyline.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the polyline and its cumulative lengths.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWireFlight.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const seconds: number = context.params.seconds;
    if (!(seconds > 0) || !Number.isFinite(seconds))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "seconds",
        value: seconds,
        feasible: {
          kind: "range",
          unit: "s",
          minimum: 0,
          maximum: Number.MAX_VALUE,
        },
        reason: "a flight takes a positive time",
        fix: "give a positive flight time",
      });
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const points: IAutoMovieVector3[] = [
      entry.root,
      ...(context.params.via ?? []),
      context.params.to,
    ];
    const lengths: number[] = [0];
    for (let k: number = 1; k < points.length; ++k)
      lengths.push(
        lengths[k - 1]! + Vector3.distance(points[k - 1]!, points[k]!),
      );
    const total: number = lengths[lengths.length - 1]!;
    if (!(total > 1e-6))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "to",
        value: "the start",
        feasible: {
          kind: "alternatives",
          values: ["a point away from the start"],
        },
        reason: "a flight path has a length",
        fix: "give an end or a waypoint away from where the body stands",
      });
    const travel: IAutoMovieVector3 = Vector3.subtract(
      context.params.to,
      entry.root,
    );
    const heading: number =
      Math.hypot(travel.x, travel.z) > 1e-6
        ? (Math.atan2(travel.x, travel.z) * 180) / Math.PI
        : entry.yaw;
    const turn: number = wrap(heading - entry.yaw);
    const shape: IShape = SHAPES[context.params.shape ?? "hover"];
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(seconds, [
      { name: "takeoff", seconds: 0 },
      { name: "land", seconds },
    ]);

    // The point at an arc length along the polyline.
    const along = (s: number): IAutoMovieVector3 => {
      let k: number = 1;
      while (k < lengths.length - 1 && lengths[k]! < s) ++k;
      const span: number = lengths[k]! - lengths[k - 1]!;
      const u: number = span > 0 ? (s - lengths[k - 1]!) / span : 0;
      return Vector3.add(
        points[k - 1]!,
        Vector3.scale(Vector3.subtract(points[k]!, points[k - 1]!), u),
      );
    };
    // The shape's weight: in over the first quarter, out over the last.
    const weight = (t: number): number => {
      const u: number = t / seconds;
      return u < 0.25
        ? minimumJerk(u / 0.25).s
        : u > 0.75
          ? minimumJerk((1 - u) / 0.25).s
          : 1;
    };

    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(
          seconds,
          {
            root: entry.root,
            yaw: entry.yaw,
            pitch: 0,
            roll: 0,
            joints: {},
            limbs: {},
          },
          [],
        ),
        clock,
        primitives: [
          {
            channels: ["root"],
            reads: ["root"],
            from: 0,
            to: seconds,
            write: (
              posture: IAutoMovieMotionHumanPosture,
              t: number,
              _before?: IAutoMovieMotionHumanPrimitive.Reader,
            ): IAutoMovieMotionHumanPosture => {
              const at: IAutoMovieVector3 = along(
                total * minimumJerk(Math.min(1, Math.max(0, t / seconds))).s,
              );
              const offset: IAutoMovieVector3 = Vector3.subtract(
                at,
                entry.root,
              );
              return AutoMovieMotionHumanRoot.place(posture, {
                point: {
                  ...HumanFrame.local(
                    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
                    offset,
                  ),
                  y: offset.y,
                },
                yaw: turn * Math.min(1, (4 * t) / seconds),
              });
            },
          },
          AutoMovieMotionHumanLean.tilt({
            from: 0,
            to: seconds,
            angles: (t: number): IAutoMovieMotionHumanLean.IAngles => ({
              pitch: shape.pitch * weight(t),
              roll: 0,
            }),
          }),
          AutoMovieMotionHumanJoints.add({
            channels: ["head", "leftLeg", "rightLeg", "leftArm", "rightArm"],
            from: 0,
            to: seconds,
            delta: (t: number): IAutoMovieMotionHumanJoints.Angles => {
              const w: number = weight(t);
              const out: IAutoMovieMotionHumanJoints.Angles = {};
              for (const [bone, angles] of Object.entries(shape.joints))
                out[bone as keyof IAutoMovieMotionHumanJoints.Angles] = [
                  angles![0] * w,
                  angles![1] * w,
                  angles![2] * w,
                ];
              return out;
            },
          }),
        ],
      });
    const touches: readonly IAutoMovieMotionHumanWireFlight.ITouch[] =
      context.params.touches ?? [];
    if (touches.length === 0) return { ...plan, physicalWindow: null };

    // Each touch: the hand or the foot meets its surface around its share,
    // coming in and going out over `TOUCH` on either side.
    const window: number = Math.min(TOUCH, seconds / 4);
    const root: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 =>
      along(total * minimumJerk(Math.min(1, Math.max(0, t / seconds))).s);
    const placed: readonly IPlaced[] = touches.map(
      (touch: IAutoMovieMotionHumanWireFlight.ITouch, k: number): IPlaced => {
        if (!(touch.at >= 0 && touch.at <= 1))
          throw new HumanRefusal({
            kind: "parameter",
            axis: `touches.${k}.at`,
            value: touch.at,
            feasible: { kind: "range", unit: "share", minimum: 0, maximum: 1 },
            reason: "a touch happens at a share of the flight",
            fix: "give a share between 0 and 1",
          });
        const at: number = touch.at * seconds;
        const leg: boolean =
          touch.part === "leftFoot" || touch.part === "rightFoot";
        const aim: ReturnType<typeof context.aim> = context.aim(
          touch.target,
          context.start + at,
        );
        // The hip or the shoulder, from the root along the body's axis.
        const base: IAutoMovieVector3 = Vector3.add(root(at), {
          x: 0,
          y: leg
            ? context.body.measure.hipHeight
            : SHOULDER * context.body.measure.stature,
          z: 0,
        });
        const reach: number = leg
          ? context.body.measure.hipHeight
          : context.body.measure.upperArm + context.body.measure.forearm;
        const gap: number = Vector3.distance(base, aim.point);
        if (gap > reach)
          throw new HumanRefusal({
            kind: "reach",
            axis: `touches.${k}.target`,
            value: gap,
            feasible: { kind: "range", unit: "m", minimum: 0, maximum: reach },
            reason: `the ${touch.part} would meet its surface ${gap.toFixed(2)} m from its joint on the path; it reaches ${reach.toFixed(2)} m`,
            fix: "bring the path closer to the surface at that share",
          });
        return {
          touch,
          at,
          leg,
          point: Vector3.add(
            aim.point,
            Vector3.scale(
              aim.normal,
              leg ? ANKLE * context.body.measure.stature : PALM,
            ),
          ),
        };
      },
    );
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...plan.contacts,
      ...placed.flatMap((p: IPlaced): IAutoMovieMotionHumanContactWindow[] =>
        p.touch.target.kind === "prop"
          ? [
              {
                part: p.touch.part,
                kind: "plant",
                from: Math.max(0, p.at - window / 4) / seconds,
                to: Math.min(seconds, p.at + window / 4) / seconds,
                support: { kind: "prop", subject: p.touch.target.subject },
              },
            ]
          : [],
      ),
    ];
    return {
      ...plan,
      contacts,
      physicalWindow: null,
      posture: (
        seconds_: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        let posture: IAutoMovieMotionHumanPosture = plan.posture(
          seconds_,
          channels,
          resolution,
          projection,
        );
        for (const p of placed) {
          // Full on its surface for the plateau the contact spans, ramping in
          // and out over `window` on either side of it.
          const w: number = Math.min(
            1,
            Math.max(0, 1 - (Math.abs(seconds_ - p.at) - window / 4) / window),
          );
          if (w <= 0) continue;
          const limb: AutoMovieHumanLimb = `${p.touch.part.startsWith("left") ? "left" : "right"}${p.leg ? "Leg" : "Arm"}`;
          posture = mixHumanPosture(
            posture,
            {
              ...posture,
              limbs: {
                ...posture.limbs,
                [limb]: {
                  point: p.point,
                  bend: Vector3.add(p.point, {
                    x: 0,
                    y: p.leg ? 0.3 : -0.2,
                    z: 0,
                  }),
                  planted: w >= 1,
                },
              },
            },
            minimumJerk.share(w),
          );
        }
        return posture;
      },
    };
  }

  /** How long a touch comes in before its share and goes out after, seconds: authored. */
  export const TOUCH: number = 0.3;

  /** The shoulder's height on a standing body, in statures (Drillis and Contini 1966: 0.818). */
  export const SHOULDER: number = 0.818;

  /** The ankle's height above the sole, in statures (Drillis and Contini 1966: 0.039). */
  export const ANKLE: number = 0.039;

  /** How far the wrist stands off a surface the palm lies on, metres: a palm's half thickness. */
  export const PALM: number = 0.015;

  /** One touch placed on the flight. */
  interface IPlaced {
    /** The authored touch. */
    touch: IAutoMovieMotionHumanWireFlight.ITouch;
    /** Its second in the flight. */
    at: number;
    /** Whether a foot touches. */
    leg: boolean;
    /** The wrist's or the ankle's goal there, world metres. */
    point: IAutoMovieVector3;
  }

  /** One flight shape: the body's pitch and joint angles, degrees (provisional stage readings). */
  interface IShape {
    /** Whole-body pitch, degrees; positive face down. */
    pitch: number;
    /** Clinical angle triples by bone, degrees. */
    joints: IAutoMovieMotionHumanJoints.Angles;
  }

  /** The flight shapes (provisional stage readings). */
  const SHAPES: Readonly<
    Record<IAutoMovieMotionHumanWireFlight.Shape, IShape>
  > = {
    superman: {
      pitch: 85,
      joints: {
        neck: [-40, 0, 0],
        leftUpperArm: [170, 10, 0],
        rightUpperArm: [60, 10, 0],
        rightLowerArm: [90, 0, 0],
      },
    },
    hover: {
      pitch: 0,
      joints: { leftUpperArm: [10, 20, 0], rightUpperArm: [10, 20, 0] },
    },
    seated: {
      pitch: -10,
      joints: {
        leftUpperLeg: [90, 5, 0],
        rightUpperLeg: [90, 5, 0],
        leftLowerLeg: [90, 0, 0],
        rightLowerLeg: [90, 0, 0],
        leftUpperArm: [30, 10, 0],
        rightUpperArm: [30, 10, 0],
        leftLowerArm: [60, 0, 0],
        rightLowerArm: [60, 0, 0],
      },
    },
    limp: {
      pitch: 0,
      joints: {
        neck: [25, 0, 0],
        leftUpperArm: [5, 20, 0],
        rightUpperArm: [5, 20, 0],
        leftLowerArm: [15, 0, 0],
        rightLowerArm: [15, 0, 0],
        leftUpperLeg: [10, 3, 0],
        rightUpperLeg: [10, 3, 0],
        leftLowerLeg: [20, 0, 0],
        rightLowerLeg: [20, 0, 0],
      },
    },
    stride: {
      pitch: 10,
      joints: {
        leftUpperLeg: [60, 5, 0],
        rightUpperLeg: [-20, 5, 0],
        leftLowerLeg: [70, 0, 0],
        rightLowerLeg: [40, 0, 0],
        leftUpperArm: [-30, 10, 0],
        rightUpperArm: [50, 10, 0],
        leftLowerArm: [60, 0, 0],
        rightLowerArm: [60, 0, 0],
      },
    },
  };

  /** A heading difference wrapped into (-180, 180]. */
  function wrap(degrees: number): number {
    return ((((degrees + 180) % 360) + 360) % 360) - 180;
  }
}
