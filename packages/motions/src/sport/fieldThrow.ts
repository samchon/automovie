import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanFieldThrow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropLaunch,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanHand } from "../posture/HumanHand";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AthleticsRunUp } from "./AthleticsRunUp";
import { fieldThrowKeys } from "./fieldThrowKeys";

/**
 * A field event's throw. In a circle the feet stand in the power position
 * across it, their balls pivoting while the body turns over them by the event's
 * turn; the javelin is cut from a run at the block foot's footfall
 * (`AthleticsRunUp`) and turns no further. The body's joints go from the
 * event's wind key to its release key and back to standing (`fieldThrowKeys`).
 * The implement rides the throwing hand to the release and is launched there
 * (`launches`) from its held frame at the release angle `EVENTS[event].angle`,
 * with the drag-free speed `v^2 = g d^2 / (2 cos^2 a (h + d tan a))` that lands
 * it at the authored distance, measured from the circle's inside edge or the
 * arc (World Athletics TR 33.12, 34.5).
 *
 * Refused: an implement the hands do not hold, a foot touching outside the
 * circle or past the arc (a foul, TR 33.2 and TR 32.16), and a distance needing
 * more speed than `EVENTS[event].speed`.
 *
 * First pass: the turns pivot on both balls in the power position rather than
 * the single-support steps of the elite technique; the hand's own motion is
 * keyed, so its speed at the release is not the launch's.
 *
 * Events: `windup`, `release`, `recover`.
 */
export namespace fieldThrow {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionKey = "athleticThrow";

  /** Cancel table: once recovered, into standing or walking. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["recover", 1], kind: "inertialize", entry: 0, blend: 0.25 },
    ],
    walk: [
      { window: ["recover", 1], kind: "inertialize", entry: 0, blend: 0.25 },
    ],
  };

  /** What may be cut into a throw: a run, for the javelin's approach. */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
  };

  /** One event's figures. */
  export interface IEvent {
    /** The body's turn over the feet before the release, degrees. */
    turn: number;

    /** Seconds of that turn. */
    seconds: number;

    /** The release angle above the horizontal, degrees. */
    angle: number;

    /** The greatest release speed the event admits, m/s. */
    speed: number;
  }

  /**
   * The events: turns of half, one and a half and three and a half turns (the
   * shot's turn to the front, the discus' 1.5 turns, the hammer's three turns
   * and its turn into the release; provisional seconds), the optimum release
   * angles measured for each (shot 37, Linthorne 2001, J Sports Sci 19:359;
   * discus 35, Leigh, Gross, Li and Yu 2008, J Sports Sci 26:1021; hammer 40,
   * Dapena 1984, J Biomech 17:553; javelin 33, Morriss and Bartlett 1996,
   * Sports Med 21:438), and release speeds a little above the world-record
   * throws' (about 14, 25, 30 and 30 m/s).
   */
  export const EVENTS: Readonly<
    Record<IAutoMovieMotionHumanFieldThrow.Event, IEvent>
  > = {
    shot: { turn: 180, seconds: 0.5, angle: 37, speed: 14.5 },
    discus: { turn: 540, seconds: 1.2, angle: 35, speed: 26 },
    hammer: { turn: 1260, seconds: 2.4, angle: 40, speed: 30 },
    javelin: { turn: 0, seconds: 0, angle: 33, speed: 31 },
  };

  /**
   * Seconds from the end of the turn to the release (provisional, a delivery's
   * tenths of a second).
   */
  export const DELIVER: number = 0.25;

  /** Seconds from the release back to standing (provisional). */
  export const RECOVER: number = 0.8;

  /**
   * Plan a throw.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When no hand holds the implement, the area lacks its
   *   contact, a foot falls outside the circle or past the arc, the distance is
   *   not positive, or the distance needs more than the event's release speed.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFieldThrow.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanFieldThrow.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const spec: IEvent = EVENTS[p.event];
    HumanBound.above("distance", p.distance, 0, "m");
    const side: AutoMovieHumanSide | undefined =
      context.entry.holds.right === p.implement
        ? "right"
        : context.entry.holds.left === p.implement
          ? "left"
          : undefined;
    if (side === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "implement",
        value: p.implement,
        reason: `no hand holds ${p.implement}`,
        fix: "pick the implement up before the throw",
      });
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
      context,
      side,
      p.implement,
    );

    // The area: its contact, its centre and the throw's direction.
    const read: IAutoMovieMotionHumanPropReader = context.prop(p.area);
    const placed: IAutoMovieRigidTransform = read.frame(context.start);
    const id: string = p.event === "javelin" ? "arc" : "circle";
    const contact: IAutoMovieAffordance | undefined = (
      read.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === id);
    if (contact === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "area",
        value: p.area,
        reason: `${p.area} declares no ${id}`,
        fix: "name a throwing circle or javelin runway, as createThrowingCircle builds",
      });
    const centre: IAutoMovieVector3 = Vector3.add(
      placed.position,
      Quaternion.rotateVector(placed.rotation, contact.frame.translation),
    );
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(placed.rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    const yaw: number = (Math.atan2(ahead.x, ahead.z) * 180) / Math.PI;

    // The javelin is cut from a run at the non-throwing foot's footfall.
    const leg: number = body.measure.thigh + body.measure.shank;
    const approach: AthleticsRunUp.IApproach | undefined =
      p.event === "javelin"
        ? AthleticsRunUp(context, 0, "approach", other)
        : undefined;
    if (p.event === "javelin" && approach === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "approach",
        value: context.entry.from?.family ?? "none",
        feasible: { kind: "alternatives", values: ["run"] },
        reason: "a javelin is thrown out of a run",
        fix: `run, and cut the run at the ${other} foot's footfall`,
      });
    // Each foot pivots on the ball the entry planted it on: the thrower is
    // placed in the stance the throw turns over. A javelin's rear foot,
    // still in the air at the block, comes down on the ground beneath it.
    const ball: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: {
        ...HumanFoot.point(body, "left", "ball", context.entry.feet.left),
        y: centre.y,
      },
      right: {
        ...HumanFoot.point(body, "right", "ball", context.entry.feet.right),
        y: centre.y,
      },
    };
    const middle: IAutoMovieVector3 = Vector3.lerp(ball.left, ball.right, 0.5);

    // Each foot keeps the turn it was entered with off the body's heading
    // (its toe-out) while it pivots, so the throw starts on the feet as
    // they stand.
    const facing: number = yaw - spec.turn;
    const out: Record<AutoMovieHumanSide, number> = {
      left: wrapDegrees(
        HumanFoot.heading(context.entry.feet.left.rotation) - facing,
      ),
      right: wrapDegrees(
        HumanFoot.heading(context.entry.feet.right.rotation) - facing,
      ),
    };
    const footAt: (
      s: AutoMovieHumanSide,
      heading: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      s: AutoMovieHumanSide,
      heading: number,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      HumanFoot.pivot(body, s, "ball", ball[s], heading + out[s], 0);

    // A foot touching outside the circle, or past the arc, is a foul.
    const radius: number =
      p.event === "javelin"
        ? (contact.depth ?? 8)
        : (contact.width ?? 2.135) / 2;
    const middleOfArc: IAutoMovieVector3 =
      p.event === "javelin"
        ? Vector3.subtract(centre, Vector3.scale(ahead, radius))
        : centre;
    // Read on the feet as entered and as turned to the release.
    for (const s of ["left", "right"] as const)
      for (const foot of [context.entry.feet[s], footAt(s, yaw)])
        for (const point of ["heel", "toe"] as const) {
          const at: IAutoMovieVector3 = HumanFoot.point(body, s, point, foot);
          const out: number =
            Math.hypot(at.x - middleOfArc.x, at.z - middleOfArc.z) - radius;
          const beyond: boolean =
            p.event === "javelin"
              ? out > 0 &&
                Vector3.dot(Vector3.subtract(at, middleOfArc), ahead) > 0
              : out > 0;
          if (beyond)
            throw new HumanRefusal({
              kind: "parameter",
              axis: "area",
              value: out,
              feasible: { kind: "range", minimum: null, maximum: 0, unit: "m" },
              reason: `the ${s} ${point} lands ${(out * 1000).toFixed(0)} mm ${p.event === "javelin" ? "past the arc" : "outside the circle"}, a foul`,
              fix: "stand further inside the throwing area",
            });
        }

    // The clock and the posture.
    const release: number = spec.seconds + DELIVER;
    const duration: number = release + RECOVER;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(duration, [
      { name: "windup", seconds: 0 },
      { name: "release", seconds: release },
      { name: "recover", seconds: duration },
    ]);
    const keys: fieldThrowKeys.IKeys = fieldThrowKeys(body, p.event, side);
    const heading: (t: number) => number = (t: number): number =>
      spec.seconds <= 0
        ? yaw
        : yaw -
          spec.turn *
            (1 - minimumJerk.share(Math.min(1, Math.max(0, t / spec.seconds))));
    const joints: (t: number) => IAutoMovieMotionHumanExerciseKey.IKey = (
      t: number,
    ): IAutoMovieMotionHumanExerciseKey.IKey =>
      t <= spec.seconds
        ? keys.wind
        : t <= release
          ? fieldThrowKeys.blend(
              keys.wind,
              keys.release,
              minimumJerk.share((t - spec.seconds) / DELIVER),
            )
          : fieldThrowKeys.blend(
              keys.release,
              keys.stand,
              minimumJerk.share(Math.min(1, (t - release) / RECOVER)),
            );
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const hipsHeight: number =
      centre.y +
      Math.sqrt(
        Math.max(
          0,
          (0.95 * leg) ** 2 -
            (Vector3.distance(ball.left, ball.right) / 2) ** 2,
        ),
      ) +
      body.rest.get("leftFoot")!.y +
      (hipsRest.y - body.rest.get("leftUpperLeg")!.y);
    const postureAt: (
      base: IAutoMovieMotionHumanPosture,
      t: number,
    ) => IAutoMovieMotionHumanPosture = (
      base: IAutoMovieMotionHumanPosture,
      t: number,
    ): IAutoMovieMotionHumanPosture => {
      const key: IAutoMovieMotionHumanExerciseKey.IKey = joints(t);
      const turned: IAutoMovieMotionHumanPosture = {
        ...base,
        yaw: heading(t),
        pitch: key.pitch,
        roll: 0,
        joints: { ...base.joints, ...key.joints },
      };
      const hips: IAutoMovieVector3 = { ...middle, y: hipsHeight };
      return {
        ...turned,
        root: Vector3.subtract(
          hips,
          Quaternion.rotateVector(humanPostureHeading(turned), hipsRest),
        ),
      };
    };
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root", "trunk", "head", "leftArm", "rightArm"],
        reads: ["root", "trunk"],
        from: 0,
        to: duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          t: number,
        ): IAutoMovieMotionHumanPosture => postureAt(posture, t),
      },
      ...(["left", "right"] as const).map(
        (s: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive =>
          AutoMovieMotionHumanLeg.place({
            body,
            side: s,
            from: 0,
            to: duration,
            placement: (
              _: IAutoMovieMotionHumanPosture,
              t: number,
            ): IAutoMovieMotionHumanFoot.IPlacement => footAt(s, heading(t)),
            planted: (): boolean => true,
          }),
      ),
    ];

    // The release: the implement's frame on the released grip, launched at
    // the event's angle with the speed that lands it at the distance.
    const released: IAutoMovieMotionHumanPosture = postureAt(
      context.entry.posture,
      release,
    );
    const grip: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, released),
      undefined,
      HumanHand.frameBones(body, side, "grip"),
    );
    const hand: IAutoMovieResolvedBone = grip.get(`${side}Hand`)!;
    const point: IAutoMovieVector3 = Vector3.add(
      HumanHand.frame(body, grip, side, "grip").point,
      Quaternion.rotateVector(hand.worldRotation, held.frame.position),
    );
    const landing: IAutoMovieVector3 = Vector3.add(
      middleOfArc,
      Vector3.scale(ahead, radius + p.distance),
    );
    const flat: IAutoMovieVector3 = {
      x: landing.x - point.x,
      y: 0,
      z: landing.z - point.z,
    };
    const d: number = Math.hypot(flat.x, flat.z);
    const a: number = (spec.angle * Math.PI) / 180;
    const h: number = point.y - landing.y;
    const g: number = AutoMovieGravity.STANDARD;
    const lift: number = h + d * Math.tan(a);
    const speed: number = Math.sqrt(
      (g * d * d) / (2 * Math.cos(a) ** 2 * Math.max(1e-9, lift)),
    );
    if (!(lift > 0) || speed > spec.speed)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "distance",
        value: p.distance,
        reason: `the ${p.event} would leave the hand at ${speed.toFixed(1)} m/s for ${p.distance.toFixed(2)} m, past the event's ${spec.speed} m/s`,
        fix: "throw shorter",
      });
    const along: IAutoMovieVector3 = Vector3.scale(flat, 1 / d);
    const launch: IAutoMovieMotionPropLaunch = {
      prop: p.implement,
      seconds: release,
      point,
      velocity: {
        x: along.x * speed * Math.cos(a),
        y: speed * Math.sin(a),
        z: along.z * speed * Math.cos(a),
      },
      rotation: Quaternion.multiply(hand.worldRotation, held.frame.rotation),
    };
    const plan: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, context.entry.posture, [
          ...(["left", "right"] as const).map(
            (s: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
              part: `${s}Foot`,
              kind: "pivot",
              from: 0,
              to: 1,
              support: { kind: "ground" },
            }),
          ),
          {
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: release / duration,
            support: { kind: "prop", subject: p.implement },
          },
        ]),
        clock,
        primitives,
      });
    return { ...plan, launches: [launch] };
  }
}
