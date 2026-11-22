import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
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

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../compose/courseArmGoal";
import { seated } from "../everyday/seated";
import { sitPlace } from "../everyday/sitPlace";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmObstacleBones } from "../posture/HumanArmObstacleBones";
import { HumanColliders } from "../posture/HumanColliders";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatPose } from "./HumanUnseatPose";
import { hangMountedLeg } from "./hangMountedLeg";

/** The law's context. */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBoard>;

/** Bounds of an admitted boarding, in the seat's moving frame (provisional): the most the performer moves relative to the seat at the take-off, metres per second; the farthest level way; the most it rises and drops. */
const BOUNDS: Readonly<Record<"speed" | "reach" | "rise" | "drop", number>> = {
  speed: 1.5,
  reach: 2.5,
  rise: 1.5,
  drop: 3,
};

/** Seconds the landed seat takes to settle (provisional). */
const SETTLE: number = 0.3;

/** Seconds the holding hand takes to close on its hold from the take-off (provisional). */
const GRASP: number = 0.15;

/** A partner's bones a hand resting on the partner keeps clear of: the trunk and the thighs. */
const PARTNER: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    ...HumanArmObstacleBones.TRUNK,
    "leftUpperLeg",
    "rightUpperLeg",
  ]);

/** The share of the flight a held hand keeps its hold for: to the landing, so the support passes from the hold to the seat with no gap. */
const LET_GO: number = 1;

/**
 * Board a moving carrier's seat (`IAutoMovieMotionHumanBoard`): in the seat contact's moving frame the root travels from where it takes off to its seated place on the seat by a minimum-jerk share, so it leaves and lands with the seat's own velocity, rising `height` over the straight way on a parabola of the share; the shape blends from the entry into an upright astride seat with the legs hanging (`hangMountedLeg`), a held hand keeping its hold until `LET_GO` of the flight. Register `HumanBoard` to use it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the path, its velocities at both ends, the shape and the hold.
 * @evidence contracts/development/design.md#principled-representation One law; the flight as a share in the seat's moving frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The law's name, cut table and planner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The seat and the held contact are the carrier's own moving ones; a partner's bone is the partner's displayed one.
 */
export const HumanBoard: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBoard> =
  {
    name: "board",
    interrupts: {},
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
    plan(context: Context): IAutoMovieMotionHumanActionPlan {
      return plan(context);
    },
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
  const socket: IAutoMovieVector3 = seated.point(context.body, seat);
  const sitting: IAutoMovieMotionHumanPosture = {
    ...from,
    root: seated.root(context.body, socket, {
      yaw: 0,
      pitch: upright.pitch,
      roll: 0,
    }),
    yaw: 0,
    pitch: upright.pitch,
    roll: 0,
    joints: { ...upright.joints },
    limbs: {},
  };
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
  const holdWindow: IAutoMovieMotionHumanContactWindow[] =
    hand === undefined
      ? []
      : [
          {
            part: `${hand.side}Hand`,
            kind: "grip",
            from: 0,
            to: release / duration,
            support:
              hand.contact !== undefined
                ? { kind: "prop", subject: params.on }
                : { kind: "person", subject: hand.partner!, bone: hand.bone! },
          },
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
        at: carrier(context.start + flight).position,
        yaw: 0,
        ...(seat.depth === undefined ? {} : { depth: seat.depth }),
      },
    },
    posture: (time: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.max(0, Math.min(duration, time));
      const world: IAutoMovieMotionHumanPosture = boarding(t);
      const point: IAutoMovieVector3 | undefined = held(
        context.start + Math.min(t, release),
      );
      if (point === undefined || hand === undefined) return world;
      const reached: IAutoMovieMotionHumanPosture = HumanUnseatPose.reach(
        world,
        hand.side,
        point,
        1,
      );
      // A hand on a partner rests on the partner's body: its trunk and thighs, placed as displayed, are the colliders the arm keeps clear of up to the wrist.
      if (hand.partner === undefined) return reached;
      const partner: IAutoMovieMotionHumanPerformerReader = context.performer(
        hand.partner,
      );
      reached.limbs = {
        ...reached.limbs,
        [`${hand.side}Arm`]: {
          ...reached.limbs[`${hand.side}Arm`]!,
          rests: HumanColliders.preparePlaced(
            partner.body,
            PARTNER,
          )(partner.bones(context.start + Math.min(t, release), PARTNER)),
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
    ready: Math.max(Math.min(GRASP, release), grasped),
    relax: Math.max(release, grasped),
    end: duration,
  };
  return HumanMountedFrame.coursed(
    goals,
    carrier,
    context.start,
    (local: IAutoMovieMotionHumanActionPlan) =>
      courseArmGoal({
        body: context.body,
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
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, hand.side),
        span,
      }),
  );
}
