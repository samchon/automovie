import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrutchStairs,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { support } from "../actions/support";
import { supportContact } from "../actions/supportContact";
import { getUp } from "../floor/getUp";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** World vertical. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** How high a crutch tip clears a nosing as it moves, metres (provisional, as the crutch walk's lift). */
const LIFT: number = 0.04;

/** The first nosing's distance ahead of the toes when the author gives none, metres: the climb's own default (`climbStairsFlight.START`). */
const START: number = 0.05;

/** Where on its tread a foot's ball and a crutch's tip come down, as a share of the tread measured from its front edge back (provisional: the ball over the tread's rear part, the toes inside its front edge). */
const ON: number = 0.7;

/** The two joints a held leg sets. */
type LegJoint = "hip" | "knee";

/** The hip's and knee's flexion that hold the injured foot off the steps, degrees: the crutch walk's three-point gait's. */
const HELD: Readonly<Record<LegJoint, number>> = { hip: 30, knee: 80 };

/** One crutch move: when it lifts and plants, and the two levels it moves between. */
interface IMove {
  /** Lift, seconds since the climb's start. */
  from: number;

  /** Plant, seconds since the climb's start. */
  to: number;

  /** The level left. */
  level: number;
}

/** The climb's resolved shape and clock. */
interface IClimb {
  /** +1 going up, -1 going down. */
  sign: number;

  /** Each riser's height, metres. */
  riser: number;

  /** Each tread's depth, metres. */
  tread: number;

  /** The first nosing's distance ahead of the toes, metres. */
  start: number;

  /** Seconds before the first step: the hands take the grips. */
  ready: number;

  /** Seconds each step takes. */
  step: number;

  /** Each crutch move. */
  moves: readonly IMove[];
}

/** The climb's shape and clock from its parameters, refused where the climb's own bounds refuse. */
function resolve(
  params: IAutoMovieMotionHumanCrutchStairs,
  hipHeight: number | undefined,
  footLength: number | undefined,
): IClimb {
  HumanBound.whole("count", params.count);
  const riser: number = params.riser ?? 0.17;
  const tread: number = params.tread ?? 0.28;
  if (hipHeight !== undefined)
    HumanBound.within("riser", riser, 0, 0.35 * hipHeight, "m", "minimum");
  if (footLength !== undefined)
    HumanBound.least("tread", tread, 0.6 * footLength, "m");
  const step: number = params.seconds ?? 2;
  HumanBound.above("seconds", step, 0, "s");
  const sign: number = (params.direction ?? "up") === "up" ? 1 : -1;
  const ready: number = step / 4;
  const moves: IMove[] = Array.from(
    { length: params.count },
    (_v: unknown, i: number): IMove => {
      const t: number = ready + i * step;
      // Up: the sound foot steps first, then the crutches; down: the crutches first.
      return sign > 0
        ? { from: t + step / 2, to: t + step, level: i }
        : { from: t, to: t + step / 2, level: i };
    },
  );
  return {
    sign,
    riser,
    tread,
    start: params.start ?? START,
    ready,
    step,
    moves,
  };
}

/** How far ahead of the toes, and how high, a level's foot or tip comes down. */
function level(climb: IClimb, k: number): IAutoMovieVector3 {
  return k === 0
    ? { x: 0, y: 0, z: 0 }
    : {
        x: 0,
        y: climb.sign * k * climb.riser,
        z: climb.start + (k - 1 + ON) * climb.tread,
      };
}

/** A crutch's frame at a second: planted at its level, or on its move's path, up first and then over going up, over first and then down going down. */
function frameAt(
  climb: IClimb,
  start: IAutoMovieRigidTransform,
  seconds: number,
): IAutoMovieRigidTransform {
  const forward: IAutoMovieVector3 = Vector3.normalize({
    ...Quaternion.rotateVector(start.rotation, { x: 0, y: 0, z: 1 }),
    y: 0,
  });
  const place = (offset: IAutoMovieVector3): IAutoMovieRigidTransform => ({
    position: Vector3.add(
      Vector3.add(start.position, Vector3.scale(forward, offset.z)),
      Vector3.scale(UP, offset.y),
    ),
    rotation: start.rotation,
  });
  let k: number = 0;
  for (const move of climb.moves) {
    if (seconds <= move.from) break;
    if (seconds < move.to) {
      const s: number = (seconds - move.from) / (move.to - move.from);
      const a: IAutoMovieVector3 = level(climb, move.level);
      const b: IAutoMovieVector3 = level(climb, move.level + 1);
      const clamp = (v: number): number =>
        minimumJerk.share(Math.min(1, Math.max(0, v)));
      const along: number =
        climb.sign > 0 ? clamp((s - 0.3) / 0.7) : clamp(s / 0.6);
      const rise: number =
        climb.sign > 0
          ? (climb.riser + LIFT) * clamp(s / 0.5) -
            LIFT * clamp((s - 0.6) / 0.4)
          : LIFT * clamp(s / 0.3) -
            (climb.riser + LIFT) * clamp((s - 0.4) / 0.6);
      return place({ x: 0, y: a.y + rise, z: a.z + (b.z - a.z) * along });
    }
    k = move.level + 1;
  }
  return place(level(climb, k));
}

/** How many treads the sound foot has stepped onto by a second since the climb's start: going up it steps at the middle of each step, going down at its end. */
function arrived(climb: IClimb, seconds: number): number {
  let k: number = 0;
  for (let i: number = 0; i < climb.moves.length; ++i)
    if (
      seconds >=
      climb.ready + i * climb.step + (climb.sign > 0 ? 0.5 : 1) * climb.step
    )
      k = i + 1;
  return k;
}

/** Refuse a crutch setting with its reason. */
function refuse(axis: string, value: unknown, reason: string): never {
  throw new HumanRefusal({
    kind: "affordance",
    axis,
    value,
    reason,
    fix: "stage both crutches on the floor level with the toes, each with a grip and a tip",
  });
}

/**
 * Climbing stairs on two crutches (#3994): "up with the good, down with the
 * bad" (HealthLinkBC, Using crutches). The hands take the handgrips on both
 * feet, then the injured leg is held off the steps (`HELD`). Going up, each
 * step first sets the sound foot down on the next tread while the crutches
 * stay planted (`footUp<n>`), then lifts both crutches up and over the
 * nosing onto that tread (`crutchUp<n>`); going down, each step first moves
 * both crutches over and down onto the next tread (`crutchDown<n>`), then
 * sets the sound foot down beside them (`footDown<n>`). A foot's ball and a
 * crutch's tip come down `ON` of the tread back from its front edge. The flight's riser and tread are bounded as the climb
 * bounds them (`climbStairsFlight`: a riser above 0.35 of the hip height, a
 * tread shorter than 0.6 of the foot, refused), since the climb is the sound
 * leg's single step-up or step-down. The crutch props share the climb's
 * clock (`track`), so the scene's crutches and the body read one course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both orders, their source, the events, the bounds and how the props share the clock.
 * @evidence contracts/development/design.md#principled-representation Support stances on the treads with the hands on the crutches, and one track per crutch from the same flight.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One law and its crutch track.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hands bear at the crutches' own grips; every foot and tip place follows from the flight.
 *
 * Each step takes `seconds`, 2 s when absent (provisional, missing a study), after an opening of a quarter of a step in which the hands take the grips.
 */
export const HumanCrutchStairs: IAutoMovieMotionHumanCrutchStairs.ILaw = {
  name: "crutchStairs",
  interrupts: {},

  track: (
    start: IAutoMovieRigidTransform,
    params: IAutoMovieMotionHumanCrutchStairs,
    startsAt: number = 0,
  ): ((filmSecond: number) => IAutoMovieRigidTransform) => {
    const climb: IClimb = resolve(params, undefined, undefined);
    return (filmSecond: number): IAutoMovieRigidTransform =>
      frameAt(climb, start, filmSecond - startsAt);
  },

  plan: (
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCrutchStairs>,
  ): IAutoMovieMotionHumanActionPlan => {
    const { params, body }: typeof context = context;
    const climb: IClimb = resolve(
      params,
      body.measure.hipHeight,
      body.measure.footLength,
    );
    const injured: AutoMovieHumanSide = params.injured ?? "left";
    const sound: AutoMovieHumanSide = injured === "left" ? "right" : "left";
    for (const side of ["left", "right"] as const) {
      const subject: string = side === "left" ? params.left : params.right;
      const affordances: readonly IAutoMovieAffordance[] =
        context.prop(subject).prop.affordances ?? [];
      if (
        !["grip", "tip"].every((id: string): boolean =>
          affordances.some((a: IAutoMovieAffordance): boolean => a.id === id),
        )
      )
        refuse(side, subject, "a crutch declares a grip and a tip");
      if (
        Math.abs(context.prop(subject).frame(context.start).position.y) > 0.01
      )
        refuse(
          side,
          subject,
          "the crutch does not start on its tip on the floor",
        );
    }
    const hand = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanSupport.IContact => ({
      part: `${side}Hand`,
      kind: "grip",
      target: {
        kind: "prop",
        subject: side === "left" ? params.left : params.right,
        point: "grip",
      },
    });
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const forward: IAutoMovieVector3 = {
      x: Math.sin((entry.yaw * Math.PI) / 180),
      y: 0,
      z: Math.cos((entry.yaw * Math.PI) / 180),
    };
    const [left, right]: IAutoMovieVector3[] = supportContact.onFloors(
      body,
      entry,
      ["leftFoot", "rightFoot"],
    );
    const floor: IAutoMovieVector3 = sound === "left" ? left! : right!;
    // The sound foot's ball sits a quarter of the foot behind the toes.
    const ball = (k: number): IAutoMovieMotionHumanSupport.IContact => {
      const offset: IAutoMovieVector3 = level(climb, k);
      const ahead: number =
        k === 0 ? 0 : offset.z + 0.25 * body.measure.footLength;
      return {
        part: `${sound}Foot`,
        kind: "bear",
        target: {
          kind: "point",
          frame: "world",
          at: Vector3.add(
            Vector3.add(floor, Vector3.scale(forward, ahead)),
            Vector3.scale(UP, offset.y),
          ),
          normal: UP,
        },
      };
    };
    const prefer: IAutoMovieMotionHumanSupport.IStance["prefer"] =
      getUp.quiet(body);
    const stances: IAutoMovieMotionHumanSupport.IStance[] = [
      {
        contacts: [
          {
            part: "leftFoot",
            kind: "bear",
            target: { kind: "point", frame: "world", at: left!, normal: UP },
          },
          {
            part: "rightFoot",
            kind: "bear",
            target: { kind: "point", frame: "world", at: right!, normal: UP },
          },
          hand("left"),
          hand("right"),
        ],
        seconds: climb.ready,
        event: "crutchReady",
        prefer,
      },
    ];
    const name: string = climb.sign > 0 ? "Up" : "Down";
    for (let i: number = 0; i < params.count; ++i) {
      const footFirst: IAutoMovieMotionHumanSupport.IStance = {
        contacts: [ball(i + 1), hand("left"), hand("right")],
        seconds: climb.step / 2,
        event: `foot${name}${i + 1}`,
        prefer,
      };
      const crutchFirst = (
        k: number,
      ): IAutoMovieMotionHumanSupport.IStance => ({
        contacts: [ball(k), hand("left"), hand("right")],
        seconds: climb.step / 2,
        event: `crutch${name}${i + 1}`,
        prefer,
      });
      if (climb.sign > 0) stances.push(footFirst, crutchFirst(i + 1));
      else stances.push(crutchFirst(i), footFirst);
    }
    const plan: IAutoMovieMotionHumanActionPlan = support.plan({
      ...context,
      params: { stances },
    });

    // The injured leg held off the steps once the hands bear.
    const lifted: number = climb.ready;
    const held: number = climb.ready + climb.step / 2;
    let raised: IAutoMovieHumanLimbReference | undefined;
    const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
      seconds,
      channels,
      resolution,
      projection,
    ): IAutoMovieMotionHumanPosture => {
      const base: IAutoMovieMotionHumanPosture = plan.posture(
        seconds,
        channels,
        resolution,
        projection,
      );
      if (seconds <= lifted) return base;
      raised ??= resolveHumanPosture.reference(
        resolveHumanPosture(body, plan.posture(lifted)),
        `${injured}Leg`,
      );
      const s: number = minimumJerk(
        Math.min(1, (seconds - lifted) / (held - lifted)),
      ).s;
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...base.limbs };
      delete limbs[`${injured}Leg`];
      const from: IAutoMovieHumanLimbReference = raised;
      return {
        ...base,
        limbs,
        joints: {
          ...base.joints,
          [`${injured}UpperLeg`]: [
            from.upper[0] + (HELD.hip - from.upper[0]) * s,
            from.upper[1] * (1 - s),
            from.upper[2] * (1 - s),
          ],
          [`${injured}LowerLeg`]: [
            from.lower[0] + (HELD.knee - from.lower[0]) * s,
            from.lower[1] * (1 - s),
            from.lower[2] * (1 - s),
          ],
        },
      };
    };
    return {
      ...plan,
      posture,
      yields: ["head"],
      contacts: [
        ...plan.contacts.flatMap(
          (
            w: IAutoMovieMotionHumanContactWindow,
          ): IAutoMovieMotionHumanContactWindow[] =>
            // The injured foot bears only until it lifts; the sound foot
            // bears on the tread it stands on.
            w.part === `${injured}Foot`
              ? w.from * plan.duration >= lifted
                ? []
                : [{ ...w, to: Math.min(w.to, lifted / plan.duration) }]
              : w.part === `${sound}Foot`
                ? [
                    {
                      ...w,
                      support: {
                        kind: "ground",
                        height:
                          floor.y +
                          climb.sign *
                            climb.riser *
                            arrived(
                              climb,
                              ((w.from + w.to) / 2) * plan.duration,
                            ),
                      },
                    },
                  ]
                : [w],
        ),
        ...(["left", "right"] as const).map(
          (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
            part: `${side}Hand`,
            kind: "grip",
            from: 0,
            to: 1,
            support: {
              kind: "prop",
              subject: side === "left" ? params.left : params.right,
              carries: false,
            },
          }),
        ),
      ],
      events: [...plan.events].sort(
        (a: IAutoMovieMotionEvent, b: IAutoMovieMotionEvent): number =>
          a.share - b.share,
      ),
    };
  },
};
