import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrip } from "./HumanGrip";
import { HumanHandover } from "./HumanHandover";
import { HumanPrehension } from "./HumanPrehension";

/**
 * Handing a held prop to a receiver: the giver's half of a handover.
 *
 * The goal is the prop's place, not the arm: the giver carries the held prop
 * so its receiving grip lands on the handover point of the shared plan
 * (`HumanHandover`), holds it there while the receiver's hand arrives and
 * closes, holds on through the transfer time, and only then opens the
 * fingers and returns the hand to where it hangs; inverse kinematics solves
 * the arm, whose reference (`IHumanPosture.IGoal.reference`) passes from the
 * configuration it carried the prop in to the offer's own solution with the
 * transport's progress and back on the way home, and the rest of the body
 * holds the posture it was entered in. The
 * prop rides the giver's hand until the receiver's grip closes, then the
 * receiver's (the latest grip carries a prop), so it never jumps.
 *
 * Outcomes: `transfer` (the default) as above; `withdraw`, the offer pulled
 * back to where the hand started as the receiver's hand arrives, keeping the
 * prop; `decline`, the offer held through the transfer time and pulled back
 * when the receiver does not reach.
 *
 * Events: `offered` when the prop reaches the handover point, `release` when
 * the giver lets go or starts to withdraw. The giver grips the prop until
 * `release` in a transfer, to the end otherwise. The finger opening (0.2 s)
 * is the put down's provisional value.
 */
export namespace handOver {
  /** The action's name. */
  export const name: HumanActionName = "handOver";

  /** Cancel table: after the release the hand is free. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["release", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [
      { window: ["release", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
  };

  /** Parameters. */
  export interface IParams {
    /** The held prop's subject id. */
    prop: string;

    /** The receiver's subject id. */
    to: string;

    /** The prop's grip affordance the receiver takes. */
    handle: string;

    /** The giver's holding hand; `right` when absent. */
    hand?: HumanHand.Side;

    /** The receiver's taking hand; `right` when absent. */
    receiverHand?: HumanHand.Side;

    /** The prop's mass, kilograms; 0.09 when absent. */
    mass?: number;

    /** How the handover ends; `transfer` when absent. */
    outcome?: HumanHandover.Outcome;
  }

  /** Time the fingers take to open at the release, seconds; provisional. */
  export const OPEN: number = 0.2;

  /**
   * Plan the giver's half.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const side: HumanHand.Side = context.params.hand ?? "right";
    const body: IHumanBody = context.body;
    const held: IHumanPosture = context.entry.posture;
    const receiver: IHumanActionContext.IPerformer = context.performer(
      context.params.to,
    );
    const shared: HumanHandover.IPlan = HumanHandover.plan({
      giver: {
        body,
        side,
        bones: context.performer(context.subject).bones(context.start),
      },
      receiver: {
        body: receiver.body,
        side: context.params.receiverHand ?? "right",
        bones: receiver.bones(context.start),
      },
      prop: context.prop(context.params.prop).prop,
      frame: context.prop(context.params.prop).frame(context.start),
      handle: context.params.handle,
      ...(context.params.mass === undefined
        ? {}
        : { mass: context.params.mass }),
      ...(context.params.outcome === undefined
        ? {}
        : { outcome: context.params.outcome }),
    });

    // The giver's path: out to the offer, a hold, then home or back.
    const out: HumanPrehension.ITransport = HumanPrehension.transport(
      shared.giverFrom.point,
      shared.giverAt.point,
      { x: 0, y: 0, z: 0 },
      0,
      { from: shared.giverFrom.rotation, to: shared.giverAt.rotation },
      shared.offer,
    );
    const pullback: number =
      shared.outcome === "transfer"
        ? shared.release
        : shared.outcome === "withdraw"
          ? Math.max(shared.offer, shared.gripClosed - 0.5 * shared.reach)
          : shared.release;
    const back: number = shared.offer;
    const home: HumanPrehension.ITransport = HumanPrehension.transport(
      shared.giverAt.point,
      shared.giverFrom.point,
      { x: 0, y: 0, z: 0 },
      0,
      { from: shared.giverAt.rotation, to: shared.giverFrom.rotation },
      back,
    );
    const opens: boolean = shared.outcome === "transfer";
    const duration: number = pullback + (opens ? OPEN : 0) + back;
    const closed: IHumanPosture["joints"] = HumanGrip.fingers(
      context.entry.pose,
      side,
    );
    const flat: IHumanPosture["joints"] = HumanHand.shape(side, "flat");
    const relaxed: IHumanPosture["joints"] = HumanHand.shape(side, "relaxed");
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      body,
      held,
      side,
    );

    // The arm's two named instants: the carry it enters in and the offer,
    // solved once on its own. The offer at a small giver's shoulder height
    // needs another elbow than the carry, so a reference of the carry alone
    // left the wrist to make up the forearm's pitch and tilted the prop.
    const carried: IHumanPosture.IReference = resolveHumanPosture.reference(
      context.entry.pose,
      limb,
    );
    const offered: IHumanPosture.IReference = resolveHumanPosture.reference(
      resolveHumanPosture(body, {
        ...held,
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
    const between = (share: number): IHumanPosture.IReference => ({
      upper: blendHumanJoint(
        body,
        `${side}UpperArm`,
        carried.upper,
        offered.upper,
        share,
      ),
      lower: blendHumanJoint(
        body,
        `${side}LowerArm`,
        carried.lower,
        offered.lower,
        share,
      ),
    });
    const part: IHumanContactWindow["part"] =
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
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        let wrist: IAutoMovieVector3;
        let rotation: IAutoMovieQuaternion;
        let digits: IHumanPosture["joints"] = closed;
        let share: number = 1;
        if (t <= shared.offer) {
          wrist = out.wrist(t);
          rotation = out.turn(t);
          share = minimumJerk(t / shared.offer).s;
        } else if (t <= pullback) {
          wrist = shared.giverAt.point;
          rotation = shared.giverAt.rotation;
        } else if (opens && t <= pullback + OPEN) {
          wrist = shared.giverAt.point;
          rotation = shared.giverAt.rotation;
          digits = HumanPrehension.shape(
            { entry: closed, open: flat, closed: flat },
            1,
            minimumJerk((t - pullback) / OPEN).s,
          );
        } else {
          const r: number = t - pullback - (opens ? OPEN : 0);
          wrist = home.wrist(r);
          rotation = home.turn(r);
          share = 1 - minimumJerk(r / back).s;
          if (opens)
            digits = HumanPrehension.shape(
              { entry: flat, open: relaxed, closed: relaxed },
              1,
              r / back,
            );
        }
        return {
          ...held,
          joints: { ...held.joints, ...digits },
          limbs: {
            ...held.limbs,
            [limb]: {
              point: wrist,
              rotation,
              bend,
              reference: between(share),
              ...(t >= shared.offer && t <= pullback ? { planted: true } : {}),
            },
          },
        };
      },
    };
  }
}
