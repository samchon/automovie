import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBoard,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanBound } from "../../law/internal/HumanBound";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanAuditModel } from "../../posture/internal/HumanAuditModel";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { mixHumanPosture } from "../../posture/internal/mixHumanPosture";
import { HumanBoardAdmit } from "./HumanBoardAdmit";
import { HumanBoardHandover } from "./HumanBoardHandover";
import { HumanBoardHandoverStill } from "./HumanBoardHandoverStill";
import { HumanBoardKey } from "./HumanBoardKey";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatPose } from "./HumanUnseatPose";
import * as HumanBoardData from "./HumanBoardData";
/*
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

/*
 * Admit the boarding, solve the seated key in the seat's frame, then sample.
 */
function planHumanBoard(context: Context): IAutoMovieMotionHumanActionPlan {
  return plan(context);
}

/*
 * Admit, solve the key and sample.
 */
function plan(context: Context): IAutoMovieMotionHumanActionPlan {
  const params: IAutoMovieMotionHumanBoard = context.params;
  const flight: number = params.duration ?? 0.6;
  const height: number = params.height ?? 0.3;
  HumanBound.above("duration", flight, 0, "s");
  HumanBound.least("height", height, 0, "m");
  const support: IAutoMovieMotionHumanPropReader = context.prop(params.on);
  const carrier: HumanMountedFrame.Reader = HumanMountedFrame(
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

  const { seat, behind, key }: HumanBoardKey.IKey = HumanBoardKey(
    context,
    support,
    carrier,
    from,
    flight,
  );
  HumanBoardAdmit(context, carrier, from, key);

  const duration: number = flight + HumanBoardData.SETTLE;
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
    const s: number = AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, t / flight));
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
      ? HumanBoardData.LET_GO * flight
      : (HumanUnseatPose.reachable(
          context.body,
          hand.side,
          HumanBoardData.LET_GO * flight,
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
      : HumanBoardHandover.plan(
          hand!,
          context.performer(hand!.partner!),
          flight,
          context.start,
          // The holds as the plan's posture writes a hand on the partner (the
          // hand reached to its point on the boarding, the partner's trunk
          // and thighs the rests the arm keeps clear of up to the wrist),
          // admitted by the course's own still problem there.
          HumanBoardHandoverStill(context, hand!, boarding),
        );
  const lets: number =
    handover === undefined ? release : Math.min(release, handover.lets);
  // The other hand closes no sooner than a hand's grasp after the take-off.
  const takes: number | undefined =
    handover === undefined
      ? undefined
      : Math.min(lets, Math.max(handover.takes, Math.min(HumanBoardData.GRASP, lets)));
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
                  to: (HumanBoardData.LET_GO * flight) / duration,
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
              AutoMovieEngineMotionSampling.minimumJerkShare((t - lets) / (duration - lets)),
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
      const landing: number = HumanBoardData.LET_GO * flight;
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
    throw new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis: "hand",
      value: context.start,
      feasible: null,
      reason: `the ${hand.side} hand's hold is beyond the arm's reach at the take-off, film second ${context.start.toFixed(3)}`,
      fix: "take the hold before boarding",
    });
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: Math.max(Math.min(HumanBoardData.GRASP, lets), grasped),
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
                    relax: HumanBoardData.LET_GO * flight,
                    end: duration,
                  },
                },
              ],
            }),
      }),
  );
}

/*
 * The law's context.
 */
type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBoard>;
