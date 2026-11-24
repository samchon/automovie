import {
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBoard,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSeated,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangle } from "../audit/AutoMovieMotionHumanAuditTangle";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { courseArmGoal } from "../compose/courseArmGoal";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { seated } from "../everyday/seated";
import { sitPlace } from "../everyday/sitPlace";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanAuditModel } from "../posture/HumanAuditModel";
import { HumanColliders } from "../posture/HumanColliders";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBoardHandover } from "./HumanBoardHandover";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatPose } from "./HumanUnseatPose";
import { hangMountedLeg } from "./hangMountedLeg";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBoard>;
/** The alternatives of `BOUNDSEntryItem`'s site. */
type BOUNDSEntryItem = "speed" | "reach" | "rise" | "drop";

/**
 * Bounds of an admitted boarding, in the seat's moving frame (provisional): the
 * most the performer moves relative to the seat at the take-off, metres per
 * second; the farthest level way; the most it rises and drops.
 */
const BOUNDS: Readonly<Record<BOUNDSEntryItem, number>> = {
  speed: 1.5,
  reach: 2.5,
  rise: 1.5,
  drop: 3,
};

/** Seconds the landed seat takes to settle (provisional). */
const SETTLE: number = 0.3;

/**
 * Seconds the holding hand takes to close on its hold from the take-off
 * (provisional).
 */
const GRASP: number = 0.15;

/**
 * The share of the flight a held hand keeps its hold for: to the landing, so
 * the support passes from the hold to the seat with no gap.
 */
const LET_GO: number = 1;

/**
 * Admit the boarding, solve the seated key in the seat's frame, then sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the steps and the refusals: bad time or height, a take-off moving too fast against the seat, and a way too long, too high or too deep.
 * @evidence contracts/development/implementation.md#principled-implementation The relative take-off velocity is the central difference of the performer's own root against the seat's; the seated key is `seated.point` and `seated.root` on the seat with the upright back's angles.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission, the key, the bounds, then the sampler.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A boarding outside the bounds is refused, never shortened.
 * @evidence contracts/development/implementation.md#efficient-algorithms One key per plan; a sample reads one seat frame and at most one held point.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The key is shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the key and the carrier reader.
 */
function planHumanBoard(context: Context): IAutoMovieMotionHumanActionPlan {
  return plan(context);
}

/**
 * Board a moving carrier's seat (`IAutoMovieMotionHumanBoard`): in the seat
 * contact's moving frame the root travels from where it takes off to its seated
 * place on the seat by a minimum-jerk share, so it leaves and lands with the
 * seat's own velocity, rising `height` over the straight way on a parabola of
 * the share; the shape blends from the entry into an upright astride seat with
 * the legs hanging (`hangMountedLeg`), a held hand keeping its hold until
 * `LET_GO` of the flight. A hand holding a partner's thigh that the flight
 * carries behind the partner's back hands the hold over: the other hand takes
 * the partner's waist on its own side before the first lets go, as its arm
 * would come through the partner's trunk, so a hand holds the partner
 * throughout (`HumanBoardHandover`). Register `HumanBoard` to use it.
 */
export const HumanBoard: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBoard> =
  {
    name: "board",
    interrupts: {},
    plan: planHumanBoard,
  };

/** Admit, solve the key and sample. */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanBoard = context.params;
  const flight: number = params.duration ?? 0.6;
  const height: number = params.height ?? 0.3;
  HumanBound.above("duration", flight, 0, "s");
  HumanBound.least("height", height, 0, "m");
  const support: IAutoMovieMotionHumanPropReader = context.prop(params.on);
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame.of(
    support,
    params.on,
    params.seat,
  );
  const start: IAutoMovieRigidTransform = carrier(context.start);
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const from: IAutoMovieMotionHumanPosture = HumanMountedFrame.move(
    entry,
    start,
    HumanMountedFrame.LOCAL,
  );

  // The seated key, upright and astride with the legs hanging, in the seat's frame.
  const declared: IAutoMovieAffordance | undefined =
    support.prop.affordances?.find(
      (a: IAutoMovieAffordance): boolean => a.id === params.seat,
    );
  const seat: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    astride: true,
    ...(declared !== undefined &&
    "depth" in declared &&
    typeof declared.depth === "number"
      ? { depth: declared.depth }
      : {}),
  };
  const upright = sitPlace.BACKS.upright;
  const sat = (at: IAutoMovieVector3): IAutoMovieMotionHumanPosture => ({
    ...from,
    root: seated.root(
      context.body,
      seated.point(context.body, { ...seat, at }),
      {
        yaw: 0,
        pitch: upright.pitch,
        roll: 0,
      },
    ),
    yaw: 0,
    pitch: upright.pitch,
    roll: 0,
    joints: { ...upright.joints },
    limbs: {},
  });
  // A passenger boarding behind a partner (a pillion) sits directly behind
  // them, the front of the pelvis against the partner's seat, along the
  // seat's own forward axis: the bodies' own surfaces place it, not the
  // seat's point alone, so the hands reach the partner's waist on bent
  // elbows.
  const behind: IAutoMovieVector3 = ((): IAutoMovieVector3 => {
    const partner: string | undefined = params.hand?.partner;
    if (partner === undefined) return { x: 0, y: 0, z: 0 };
    const other: IAutoMovieMotionHumanPerformerReader =
      context.performer(partner);
    const landing: IAutoMovieRigidTransform = carrier(context.start + flight);
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      other.body.surfaces.regions.seat;
    const back: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(landing.rotation),
      Vector3.subtract(
        resolveAutoMovieHumanoidSurfaces.place(
          frame,
          other
            .bones(
              context.start + flight,
              new Set<AutoMovieHumanoidBone>([frame.bone]),
            )
            .get(frame.bone)!,
        ).point,
        landing.position,
      ),
    );
    const front: IAutoMovieVector3 = HumanTrunk.region(
      context.body,
      sat({ x: 0, y: 0, z: 0 }),
      "groin",
    ).point;
    return { x: 0, y: 0, z: back.z - front.z };
  })();
  const sitting: IAutoMovieMotionHumanPosture = sat(behind);
  const key: IAutoMovieMotionHumanPosture = {
    ...sitting,
    limbs: {
      leftLeg: hangMountedLeg(context.body, sitting, "left"),
      rightLeg: hangMountedLeg(context.body, sitting, "right"),
    },
  };

  // The take-off's velocity against the seat, and the way's reach, rise and drop.
  const h: number = 1 / 60;
  const self = (film: number): IAutoMovieVector3 =>
    context.performer(context.subject).root(film).position;
  const relative = (film: number): IAutoMovieVector3 => {
    const frame: IAutoMovieRigidTransform = carrier(film);
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(self(film), frame.position),
    );
  };
  // A performer with no motion of its own before the act has none against the seat.
  let slip: number = 0;
  try {
    slip = Vector3.length(
      Vector3.scale(
        Vector3.subtract(relative(context.start), relative(context.start - h)),
        1 / h,
      ),
    );
  } catch {
    slip = 0;
  }
  const way: IAutoMovieVector3 = Vector3.subtract(key.root, from.root);
  const checks: readonly [string, number, number][] = [
    ["speed", slip, BOUNDS.speed],
    ["reach", Math.hypot(way.x, way.z), BOUNDS.reach],
    ["rise", way.y, BOUNDS.rise],
    ["drop", -way.y, BOUNDS.drop],
  ];
  for (const [axis, value, most] of checks)
    if (value > most)
      throw new HumanRefusal({
        kind: "reach",
        axis,
        value,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: most,
          unit: axis === "speed" ? "m/s" : "m",
        },
        reason: `boarding the seat asks a ${axis} of ${value.toFixed(3)}, beyond ${most}`,
        fix: "run level with the seat and take off from within reach of it",
      });

  // A carrier asked to carry more than it declares is refused.
  if (params.load !== undefined) {
    const total: number = params.load.carried + context.body.measure.mass;
    if (total > params.load.capacity)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "load",
        value: total,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: params.load.capacity,
          unit: "kg",
        },
        reason: `boarding brings the carrier's load to ${total.toFixed(1)} kg, beyond its declared ${params.load.capacity} kg`,
        fix: "board a carrier that may carry the load, or lighten it",
      });
  }

  const duration: number = flight + SETTLE;
  const hand: IAutoMovieMotionHumanBoard.IHand | undefined = params.hand;
  const held = (film: number): IAutoMovieVector3 | undefined => {
    if (hand === undefined) return undefined;
    if (hand.contact !== undefined)
      return HumanMountedFrame.contact(support, hand.contact, film);
    // A partner's bone is held on the body's surface, not at its joint inside the body.
    if (hand.partner !== undefined && hand.bone !== undefined)
      return HumanMountedFrame.partnerHold(
        context.performer(hand.partner),
        hand.bone,
        film,
      );
    return undefined;
  };
  // The body without its holding hand: the boarding root and shape in the
  // world at a local second.
  const boarding = (time: number): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, time));
    const s: number = minimumJerk.share(Math.min(1, t / flight));
    const shown: IAutoMovieMotionHumanPosture = mixHumanPosture(from, key, s);
    shown.root = Vector3.add(Vector3.lerp(from.root, key.root, s), {
      x: 0,
      y: 4 * height * s * (1 - s),
      z: 0,
    });
    return HumanMountedFrame.move(
      shown,
      HumanMountedFrame.LOCAL,
      carrier(context.start + t),
    );
  };
  // The hand lets go at the last sampled instant up to `LET_GO` of the
  // flight at which its hold is still within the arm's reach of the
  // shoulder (`HumanUnseatPose.reachable` read from that instant back to
  // the take-off): a hold the vaulting body has carried beyond the arm is
  // let go, never chased past the arm's length.
  const release: number =
    hand === undefined
      ? LET_GO * flight
      : (HumanUnseatPose.reachable(
          context.body,
          hand.side,
          LET_GO * flight,
          0,
          boarding,
          (t: number) => held(context.start + t)!,
        ) ?? 0);
  // A hold on a partner the hand would carry behind the partner's back is
  // handed over to the other hand, which takes the partner's waist on its
  // own side before the first lets go (`HumanBoardHandover`).
  const handover: HumanBoardHandover.IHandover | undefined =
    hand?.partner === undefined
      ? undefined
      : HumanBoardHandover.kept(
          params,
          `${context.subject}|${context.start}`,
          flight,
          (): HumanBoardHandover.IHandover | undefined =>
            HumanBoardHandover.plan(
              hand!,
              context.performer(hand!.partner!),
              flight,
              context.start,
              // The holds as the plan's posture writes a hand on the partner (the
              // hand reached to its point on the boarding, the partner's trunk
              // and thighs the rests the arm keeps clear of up to the wrist),
              // admitted by the course's own still problem there.
              (
                t: number,
                holds: readonly HumanBoardHandover.IHold[],
              ): boolean => {
                // A hand the boarding's own arm fit cannot lay on its point is
                // not held there by any course, so the still problem, which
                // fails slowly through all its starts, is not asked (a necessary
                // condition tested first, as the planner tests its hold before
                // its trajectory).
                const fitted: ReturnType<typeof poseBones> = poseBones(
                  context.body,
                  resolveHumanPosture(
                    context.body,
                    holds.reduce(
                      (
                        posture: IAutoMovieMotionHumanPosture,
                        held: HumanBoardHandover.IHold,
                      ): IAutoMovieMotionHumanPosture =>
                        HumanUnseatPose.reach(
                          posture,
                          held.side,
                          held.point,
                          1,
                        ),
                      boarding(t),
                    ),
                  ),
                  undefined,
                  new Set<AutoMovieHumanoidBone>(
                    holds.map(
                      (held: HumanBoardHandover.IHold): AutoMovieHumanoidBone =>
                        `${held.side}Hand`,
                    ),
                  ),
                );
                if (
                  holds.some(
                    (held: HumanBoardHandover.IHold): boolean =>
                      Vector3.distance(
                        fitted.get(`${held.side}Hand`)!.worldPosition,
                        held.point,
                      ) > AutoMovieMotionHumanAuditTangle.BUILT,
                  )
                )
                  return false;
                const other: IAutoMovieMotionHumanPerformerReader =
                  context.performer(hand!.partner!);
                const resting: ReturnType<
                  ReturnType<typeof HumanColliders.preparePlaced>
                > = HumanColliders.preparePlaced(
                  other.body,
                  HumanAuditModel.segments(other.body),
                )(
                  other.bones(
                    context.start + t,
                    HumanAuditModel.segments(other.body),
                  ),
                );
                return AutoMovieMotionHumanArmPlanned.stands(
                  context.body,
                  {
                    seconds: t,
                    carries: holds.map(
                      (
                        held: HumanBoardHandover.IHold,
                      ): IAutoMovieMotionHumanArmPlanned.IPlanned => ({
                        side: held.side,
                        rest: AutoMovieMotionHumanArm.angles(
                          context.entry.pose,
                          held.side,
                        ),
                        weight: (): number => 1,
                        goal: (
                          _posture: IAutoMovieMotionHumanPosture,
                          seconds: number,
                        ): IAutoMovieHumanLimbGoal => ({
                          ...HumanUnseatPose.reach(
                            boarding(seconds),
                            held.side,
                            held.point,
                            1,
                          ).limbs[`${held.side}Arm`]!,
                          rests: resting,
                        }),
                      }),
                    ),
                  },
                  (seconds: number): IAutoMovieMotionHumanPosture =>
                    boarding(seconds),
                );
              },
            ),
        );
  const lets: number =
    handover === undefined ? release : Math.min(release, handover.lets);
  // The other hand closes no sooner than a hand's grasp after the take-off.
  const takes: number | undefined =
    handover === undefined
      ? undefined
      : Math.min(lets, Math.max(handover.takes, Math.min(GRASP, lets)));
  const holdWindow: IAutoMovieMotionHumanContactWindow[] =
    hand === undefined
      ? []
      : [
          {
            part: `${hand.side}Hand`,
            kind: "grip",
            from: 0,
            to: lets / duration,
            support:
              hand.contact !== undefined
                ? { kind: "prop", subject: params.on }
                : { kind: "person", subject: hand.partner!, bone: hand.bone! },
          },
          ...(handover === undefined || takes === undefined
            ? []
            : [
                {
                  part: `${handover.side}Hand` as const,
                  kind: "grip" as const,
                  from: takes / duration,
                  to: (LET_GO * flight) / duration,
                  support: {
                    kind: "person" as const,
                    subject: hand.partner!,
                    region: handover.region,
                  },
                },
              ]),
        ];
  const goals: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      { name: "takeOff", share: 0 },
      { name: "land", share: flight / duration },
    ],
    contacts: [
      ...holdWindow,
      {
        part: "seat",
        kind: "seat",
        from: flight / duration,
        to: 1,
        support: { kind: "prop", subject: params.on },
      },
    ],
    base: {
      kind: "seated",
      seat: {
        at: Vector3.add(
          carrier(context.start + flight).position,
          Quaternion.rotateVector(
            carrier(context.start + flight).rotation,
            behind,
          ),
        ),
        yaw: 0,
        ...(seat.depth === undefined ? {} : { depth: seat.depth }),
      },
    },
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const world: IAutoMovieMotionHumanPosture = boarding(t);
      const point: IAutoMovieVector3 | undefined = held(
        context.start + Math.min(t, lets),
      );
      if (point === undefined || hand === undefined) return world;
      // A hand handed over lets go: past it its goal lowers from the hold it
      // left to where a free hand hangs (`HumanUnseatPose.hang`) by the end,
      // which its course returns to, never the hold, now ahead through the
      // partner's back.
      const released: boolean =
        handover !== undefined && takes !== undefined && t > lets;
      let reached: IAutoMovieMotionHumanPosture = HumanUnseatPose.reach(
        world,
        hand.side,
        released
          ? Vector3.lerp(
              point,
              HumanUnseatPose.hang(world, hand.side),
              minimumJerk.share((t - lets) / (duration - lets)),
            )
          : point,
        1,
      );
      // A free hand hangs; it plants on nothing.
      if (released)
        reached.limbs = {
          ...reached.limbs,
          [`${hand.side}Arm`]: {
            ...reached.limbs[`${hand.side}Arm`]!,
            planted: false,
          },
        };
      // A hand on a partner rests on the partner's body: every segment the audit reads, placed as displayed, is a collider the arm keeps clear of up to the wrist.
      if (hand.partner === undefined) return reached;
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        hand.partner,
      );
      // Every segment of the partner the audit reads (`HumanAuditModel.segments`).
      const segments: ReadonlySet<AutoMovieHumanoidBone> =
        HumanAuditModel.segments(partner.body);
      const rests = (
        until: number,
      ): ReturnType<ReturnType<typeof HumanColliders.preparePlaced>> =>
        HumanColliders.preparePlaced(
          partner.body,
          segments,
        )(partner.bones(context.start + Math.min(t, until), segments));
      if (!released)
        reached.limbs = {
          ...reached.limbs,
          [`${hand.side}Arm`]: {
            ...reached.limbs[`${hand.side}Arm`]!,
            rests: rests(lets),
          },
        };
      // The other hand holds the partner's waist on its side from the
      // hand-over to the landing: its goal is that hold, as it stands at the
      // hand-over before it, the course reaching it from the rest by then.
      if (handover === undefined || takes === undefined) return reached;
      const landing: number = LET_GO * flight;
      reached = HumanUnseatPose.reach(
        reached,
        handover.side,
        HumanBoardHandover.waist(
          partner,
          handover.region,
          context.start + Math.min(Math.max(t, takes), landing),
        ),
        1,
      );
      reached.limbs = {
        ...reached.limbs,
        [`${handover.side}Arm`]: {
          ...reached.limbs[`${handover.side}Arm`]!,
          rests: rests(landing),
        },
      };
      return reached;
    },
  };
  if (hand === undefined) return goals;
  // The holding arm is laid as a planned course on its hold: the reach at the take-off, the hold to the landing, the return in the settle.
  // The hold is taken before the take-off, from the ground, as a swing-up takes the rider's waist and a running mount the horn: a hold beyond the arm's reach of the shoulder at the take-off is refused.
  const grasped: number | undefined = HumanUnseatPose.reachable(
    context.body,
    hand.side,
    0,
    0,
    (t: number) => goals.posture(t),
    (t: number) => held(context.start + t)!,
  );
  if (grasped === undefined)
    throw new HumanRefusal({
      kind: "reach",
      axis: "hand",
      value: context.start,
      feasible: null,
      reason: `the ${hand.side} hand's hold is beyond the arm's reach at the take-off, film second ${context.start.toFixed(3)}`,
      fix: "take the hold before boarding",
    });
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: Math.max(Math.min(GRASP, lets), grasped),
    relax: Math.max(lets, grasped),
    end: duration,
  };
  return HumanMountedFrame.coursed(
    goals,
    carrier,
    context.start,
    (local: IAutoMovieMotionHumanActionPlan) =>
      courseArmGoal({
        context,
        // The grip holds from the instant the hand reaches its hold.
        plan: {
          ...local,
          contacts: local.contacts.map(
            (
              c: IAutoMovieMotionHumanContactWindow,
            ): IAutoMovieMotionHumanContactWindow =>
              c.part === `${hand.side}Hand` && c.kind === "grip"
                ? { ...c, from: grasped / duration }
                : c,
          ),
        },
        side: hand.side,
        span,
        // The other hand's course, solved with the first as one problem
        // over its own instants: from its rest to the hand-over, its hold to
        // the landing, and back in the settle.
        ...(handover === undefined || takes === undefined
          ? {}
          : {
              with: [
                {
                  side: handover.side,
                  rest: AutoMovieMotionHumanArm.angles(
                    context.entry.pose,
                    handover.side,
                  ),
                  span: {
                    start: 0,
                    ready: takes,
                    relax: LET_GO * flight,
                    end: duration,
                  },
                },
              ],
            }),
      }),
  );
}
