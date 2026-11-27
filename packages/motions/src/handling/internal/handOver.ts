import { AutoMovieEngineMotionSampling, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHandover,
  IAutoMovieMotionHumanHandoverAction,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeatedReach,
  IAutoMovieMotionMeeting,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanSeatedReach } from "../../touch/internal/HumanSeatedReach";
import { HumanGrip } from "./HumanGrip";
import { HumanHandover } from "./HumanHandover";
import { HumanHandoverMeeting } from "./HumanHandoverMeeting";
import { HumanHandoverUpright } from "./HumanHandoverUpright";
import { HumanPrehension } from "./HumanPrehension";
import { handshake } from "./handshake";

/*
 * Handing a held prop to a receiver: the giver's half of a handover.
 *
 * The goal is the prop's place, not the arm: the giver carries the held prop so
 * its receiving grip lands on the handover point of the shared plan
 * (`HumanHandover`), holds it there while the receiver's hand arrives and
 * closes, holds on through the transfer time, and only then opens the fingers
 * and returns the hand to where it hangs; inverse kinematics solves the arm,
 * whose reference (`HumanPosture.IGoal.reference`) passes from the
 * configuration it carried the prop in to the offer's own solution with the
 * transport's progress and back on the way home; on the way out the prop is
 * turned about the vertical where the arm keeps it upright so, back to the
 * offer's own turn at the handover point (`HumanHandover.upright`); and the
 * rest of the body holds the posture it was entered in, a seated giver whose
 * arm alone falls short of the offer leaning its trunk forward over the seat
 * with the arm's course (`HumanSeatedReach`, the place read from the partners'
 * one meeting, `HumanHandoverMeeting`). The prop rides the giver's hand until
 * the receiver's grip closes, then the receiver's (the latest grip carries a
 * prop), so it never jumps.
 *
 * Outcomes: `transfer` (the default) as above; `withdraw`, the offer pulled
 * back to where the hand started as the receiver's hand arrives, keeping the
 * prop; `decline`, the offer held through the transfer time and pulled back
 * when the receiver does not reach.
 *
 * Events: `offered` when the prop reaches the handover point, `release` when
 * the giver lets go or starts to withdraw. The giver grips the prop until
 * `release` in a transfer, to the end otherwise. The finger opening (0.2 s) is
 * the put down's provisional value.
 */
export namespace handOver {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "handOver";

  /*
   * Cancel table: after the release the hand is free.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: { start: "release", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
    walk: [
      {
        window: { start: "release", end: 1 },
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };
  /*
   * Time the fingers take to open at the release, seconds; provisional.
   */
  export const OPEN: number = 0.2;

  /*
   * Plan the giver's half.
   * Parameter context: The action's context.
   * Returns: The plan.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanHandoverAction.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const side: AutoMovieHumanSide = context.params.hand ?? "right";
    const body: IAutoMovieMotionHumanBody = context.body;
    const held: IAutoMovieMotionHumanPosture = context.entry.posture;
    const receiver: IAutoMovieMotionHumanPerformerReader = context.performer(
      context.params.to,
    );
    const receiverSide: AutoMovieHumanSide =
      context.params.receiverHand ?? "right";
    const prop: IAutoMovieMotionHumanProp = context.prop(
      context.params.prop,
    ).prop;
    const frame: IAutoMovieRigidTransform = context
      .prop(context.params.prop)
      .frame(context.start);
    // The place both partners read from one meeting record.
    const met: IAutoMovieMotionMeeting = context.meeting(
      HumanHandoverMeeting.kind({
        giver: side,
        receiver: receiverSide,
        prop,
        frame,
        handle: context.params.handle,
        exchange: HumanHandover.EXCHANGE,
      }),
      HumanHandoverMeeting.GIVER,
      { role: HumanHandoverMeeting.RECEIVER, subject: context.params.to },
    );
    const shared: IAutoMovieMotionHumanHandover.IPlan = HumanHandover.plan({
      giver: {
        body,
        side,
        bones: context
          .performer(context.subject)
          .bones(
            context.start,
            new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
          ),
      },
      receiver: {
        body: receiver.body,
        side: receiverSide,
        bones: receiver.bones(
          context.start,
          new Set<AutoMovieHumanoidBone>([
            "hips",
            "leftFoot",
            "rightFoot",
            `${receiverSide}Hand`,
          ]),
        ),
      },
      prop,
      frame,
      handle: context.params.handle,
      ...(context.params.mass === undefined
        ? {}
        : { mass: context.params.mass }),
      ...(context.params.outcome === undefined
        ? {}
        : { outcome: context.params.outcome }),
      meet: HumanFrame.point(met.frame, met.contacts.meet!),
    });

    // Seated, the trunk leans forward over the seat as far as the offer
    // needs, the hand's target first (`HumanSeatedReach.need`), with the
    // arm's own course in and out; standing, it leans none.
    const entered: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
    );
    const shoulder: IAutoMovieVector3 = entered.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const lean: IPlanLean = HumanSeatedReach.need(
      {
        name: HumanHandoverMeeting.GIVER,
        subject: context.subject,
        body,
        posture: held,
        bones: entered,
        seated: context.entry.supports.some(
          (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
            s.kind === "seat",
        ),
      },
      shoulder,
      shared.giverAt.point,
      handshake.arm(body, side, shoulder).limit,
    );
    const leaned: (share: number) => IAutoMovieMotionHumanPosture = (
      share: number,
    ): IAutoMovieMotionHumanPosture =>
      HumanSeatedReach.posed(body, held, lean.joints, lean.share * share);

    // The giver's path: out to the offer, a hold, then home or back.
    const out: IAutoMovieMotionHumanPrehension.ITransport =
      HumanPrehension.transport(
        shared.giverFrom.point,
        shared.giverAt.point,
        { x: 0, y: 0, z: 0 },
        0,
        { from: shared.giverFrom.rotation, to: shared.giverAt.rotation },
        shared.offer,
      );
    const pullback: number =
      shared.outcome === "withdraw"
        ? Math.max(shared.offer, shared.gripClosed - 0.5 * shared.reach)
        : shared.release;
    const back: number = shared.offer;
    const home: IAutoMovieMotionHumanPrehension.ITransport =
      HumanPrehension.transport(
        shared.giverAt.point,
        shared.giverFrom.point,
        { x: 0, y: 0, z: 0 },
        0,
        { from: shared.giverAt.rotation, to: shared.giverFrom.rotation },
        back,
      );
    const opens: boolean = shared.outcome === "transfer";
    const duration: number = pullback + (opens ? OPEN : 0) + back;
    const closed: IAutoMovieMotionHumanPosture["joints"] = HumanGrip.fingers(
      context.entry.pose,
      side,
    );
    const flat: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      side,
      "flat",
    );
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
      side,
      "relaxed",
    );
    const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      held,
      side,
    );

    // The arm's two named instants: the carry it enters in and the offer,
    // solved once on its own. The offer at a small giver's shoulder height
    // needs another elbow than the carry, so a reference of the carry alone
    // left the wrist to make up the forearm's pitch and tilted the prop.
    const carried: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
      context.entry.pose,
      limb,
    );
    const offered: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
      resolveHumanPosture(body, {
        ...leaned(1),
        limbs: {
          ...held.limbs,
          [limb]: {
            point: shared.giverAt.point,
            rotation: shared.giverAt.rotation,
            bend,
          },
        },
      }),
      limb,
    );
    // Blended as rotations: the two solutions may be written in different
    // charts of the shoulder.
    const upper: ReturnType<typeof blendHumanJoint.between> =
      blendHumanJoint.between(
        body,
        `${side}UpperArm`,
        carried.upper,
        offered.upper,
      );
    const lower: ReturnType<typeof blendHumanJoint.between> =
      blendHumanJoint.between(
        body,
        `${side}LowerArm`,
        carried.lower,
        offered.lower,
      );
    const between: (share: number) => IAutoMovieHumanLimbReference = (
      share: number,
    ): IAutoMovieHumanLimbReference => ({
      upper: upper(share),
      lower: lower(share),
    });
    const openAt: ReturnType<typeof HumanPrehension.prepareShape> | undefined =
      opens
        ? HumanPrehension.prepareShape(
            { entry: closed, open: flat, closed: flat },
            1,
          )
        : undefined;
    const returnShape:
      | ReturnType<typeof HumanPrehension.prepareShape>
      | undefined = opens
      ? HumanPrehension.prepareShape(
          { entry: flat, open: relaxed, closed: relaxed },
          1,
        )
      : undefined;

    // The body at a second with the held hand turned by a yaw, degrees,
    // about the world's up. The offer's rotation is shared with the
    // receiver's grip, so the way out keeps it at both ends and chooses the
    // turn between them its arm meets with the prop upright
    // (`HumanHandoverUpright`). Every original yaw callback re-reads its raw
    // transport, digits, direct body and all complete other goals.
    const frameAt: (seconds: number) => HumanHandoverUpright.IFrame = (
      seconds: number,
    ): HumanHandoverUpright.IFrame => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      let wrist: IAutoMovieVector3;
      let rotation: IAutoMovieQuaternion;
      let digits: IAutoMovieMotionHumanPosture["joints"] = closed;
      let share: number = 1;
      if (t <= shared.offer) {
        wrist = out.wrist(t);
        rotation = out.turn(t);
        share = AutoMovieEngineMotionSampling.minimumJerkShare(
          t / shared.offer,
        );
      } else if (t <= pullback) {
        wrist = shared.giverAt.point;
        rotation = shared.giverAt.rotation;
      } else if (opens && t <= pullback + OPEN) {
        wrist = shared.giverAt.point;
        rotation = shared.giverAt.rotation;
        digits = openAt!(
          AutoMovieEngineMotionSampling.minimumJerkShare((t - pullback) / OPEN),
        );
      } else {
        const r: number = t - pullback - (opens ? OPEN : 0);
        wrist = home.wrist(r);
        rotation = home.turn(r);
        share = 1 - AutoMovieEngineMotionSampling.minimumJerkShare(r / back);
        if (opens) digits = returnShape!(r / back);
      }
      const base: IAutoMovieMotionHumanPosture = leaned(share);
      return {
        posture: { ...base, joints: { ...base.joints, ...digits } },
        goal: {
          point: wrist,
          bend,
          // Each named instant's solution counts in full at its instant.
          // Between them the blend is no arm's solution of the goal
          // there, so it only keeps the arm on its side and gives way to
          // the hand's rotation, which holds the prop upright.
          reference: {
            ...between(share),
            weight: (2 * share - 1) ** 2,
          },
          ...(t >= shared.offer && t <= pullback ? { planted: true } : {}),
        },
        rotation: (yaw: number): IAutoMovieQuaternion =>
          t <= shared.offer
            ? Quaternion.multiply(
                Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
                rotation,
              )
            : rotation,
      };
    };
    const turn: (seconds: number) => number = HumanHandover.upright(
      body,
      side,
      (seconds: number, yaw: number): IAutoMovieMotionHumanPosture =>
        HumanHandoverUpright.posed(frameAt(seconds), side, yaw),
      0,
      shared.offer,
      [0, 0],
    );
    const part: IAutoMovieMotionHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    return {
      duration,
      events: [
        { name: "offered", share: shared.offer / duration },
        { name: "release", share: pullback / duration },
      ],
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part,
          kind: "grip",
          from: 0,
          to: opens ? pullback / duration : 1,
          support: { kind: "prop", subject: context.params.prop },
        },
      ],
      contact: shared.offer,
      posture: (seconds: number): IAutoMovieMotionHumanPosture =>
        HumanHandoverUpright.posed(frameAt(seconds), side, turn(seconds)),
    };
  }
}

/*
 * The record of `IPlanLean`'s site.
 */
type IPlanLean = {
  share: number;
  joints: IAutoMovieMotionHumanSeatedReach.IJoint[];
};
