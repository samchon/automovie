import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanHandover } from "./HumanHandover";
import { HumanPrehension } from "./HumanPrehension";

/**
 * Taking a prop a giver holds out: the receiver's half of a handover.
 *
 * The goal is the offered grip, not the arm: the receiver's grip socket is
 * brought onto the prop's receiving grip where the shared plan
 * (`HumanHandover`) puts the offer, on a reach-to-grasp transport that ends
 * no earlier than the giver's, the fingers opening to the peak aperture on
 * the way and closing on the prop's colliders until contact (`HumanGrip`).
 * The hand holds still through the transfer time while the giver lets go, and
 * then brings the prop in front of the body: the wrist where the elbow hangs
 * at the side flexed to a right angle (the upper arm's length below the
 * shoulder and the forearm's ahead of it), the common carrying posture. The
 * rest of the body holds the posture it was entered in.
 *
 * Outcomes: `transfer` as above; `withdraw`, the hand stops short by the
 * approach setback as the offer is pulled back, and returns empty; `decline`,
 * the hand stays where it is.
 *
 * Events: `gripClosed` when the fingers close on the prop, `taken` at the
 * end. The hand grips the prop from `gripClosed` and holds it afterwards.
 */
export namespace receive {
  /** The action's name. */
  export const name: HumanActionName = "receive";

  /** Cancel table: once taken the prop is held. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: ["taken", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    walk: [{ window: ["taken", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /** Parameters. */
  export interface IParams {
    /** The offered prop's subject id. */
    prop: string;

    /** The giver's subject id. */
    from: string;

    /** The prop's grip affordance taken. */
    handle: string;

    /** The receiver's taking hand; `right` when absent. */
    hand?: HumanHand.Side;

    /** The giver's holding hand; `right` when absent. */
    giverHand?: HumanHand.Side;

    /** The prop's mass, kilograms; 0.09 when absent. */
    mass?: number;

    /** How the handover ends; `transfer` when absent. */
    outcome?: HumanHandover.Outcome;
  }

  /**
   * Plan the receiver's half.
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
    const giver: IHumanActionContext.IPerformer = context.performer(
      context.params.from,
    );
    const prop: IHumanActionContext.IProp = context.prop(context.params.prop);
    const shared: HumanHandover.IPlan = HumanHandover.plan({
      giver: {
        body: giver.body,
        side: context.params.giverHand ?? "right",
        bones: giver.bones(context.start),
      },
      receiver: {
        body,
        side,
        bones: context.performer(context.subject).bones(context.start),
      },
      prop: prop.prop,
      frame: prop.frame(context.start),
      handle: context.params.handle,
      ...(context.params.mass === undefined
        ? {}
        : { mass: context.params.mass }),
      ...(context.params.outcome === undefined
        ? {}
        : { outcome: context.params.outcome }),
    });
    const takes: boolean = shared.outcome === "transfer";
    const setback: number = HumanPrehension.aperture(shared.target.width);
    const short: IAutoMovieVector3 = Vector3.subtract(
      shared.receiverAt.point,
      Vector3.scale(shared.target.approach, setback),
    );
    const arrive: IAutoMovieVector3 = takes ? shared.receiverAt.point : short;
    const out: HumanPrehension.ITransport = HumanPrehension.transport(
      shared.receiverFrom.point,
      arrive,
      shared.target.approach,
      takes ? setback : 0,
      { from: shared.receiverFrom.rotation, to: shared.receiverAt.rotation },
      shared.reach,
    );

    // After the transfer: the carrying place in front of the body, or home.
    const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(body, held).get(
      `${side}UpperArm`,
    )!.worldPosition;
    const carry: IAutoMovieVector3 = HumanFrame.point(
      {
        origin: {
          x: shoulder.x,
          y: shoulder.y - body.measure.upperArm,
          z: shoulder.z,
        },
        yaw: held.yaw,
      },
      { x: 0, y: 0, z: body.measure.forearm },
    );
    const end: IAutoMovieVector3 = takes ? carry : shared.receiverFrom.point;
    // A hand that took the prop carries it; an empty one returns as it reached.
    const travel: number = Vector3.length(Vector3.subtract(end, arrive));
    const back: number = takes
      ? HumanPrehension.carry(travel)
      : HumanPrehension.nominal(travel, 0);
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(body, held, side);
    const home: HumanPrehension.ITransport = HumanPrehension.transport(
      arrive,
      end,
      { x: 0, y: 0, z: 0 },
      0,
      {
        from: shared.receiverAt.rotation,
        to: takes ? shared.receiverAt.rotation : shared.receiverFrom.rotation,
      },
      back,
    );
    const leave: number = takes ? shared.release : shared.gripClosed;
    const duration: number =
      shared.outcome === "decline" ? shared.release : leave + back;

    const closed: IHumanPosture["joints"] = takes
      ? HumanGrip.close(
          body,
          side,
          shared.target.grip,
          shared.receiverShown,
          shared.target.colliders,
        ).joints
      : HumanHand.shape(side, "relaxed");
    const open: IHumanPosture["joints"] = HumanGrasp.open(
      body,
      side,
      takes ? closed : HumanHand.shape(side, "relaxed"),
      shared.target.width,
    ).joints;
    const peak: number = HumanPrehension.peak(context.random("peak"));
    const shapes = {
      entry: HumanGrip.fingers(context.entry.pose, side),
      open,
      closed,
    };
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    const part: IHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    return {
      duration,
      events: [
        {
          name: "gripClosed",
          share: Math.min(1, shared.gripClosed / duration),
        },
        { name: "taken", share: 1 },
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
        ...(takes
          ? [
              {
                part,
                kind: "grip" as const,
                from: shared.gripClosed / duration,
                to: 1,
                support: {
                  kind: "prop" as const,
                  subject: context.params.prop,
                },
              },
            ]
          : []),
      ],
      ...(takes
        ? {
            holds: [
              {
                side,
                prop: context.params.prop,
                from: shared.gripClosed / duration,
                fingers: closed,
              },
            ],
          }
        : {}),
      hands: [side],
      contact: shared.gripClosed,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        let wrist: IAutoMovieVector3;
        let rotation: IAutoMovieQuaternion;
        let digits: IHumanPosture["joints"];
        if (shared.outcome === "decline" || t <= shared.reachStart) {
          wrist = shared.receiverFrom.point;
          rotation = shared.receiverFrom.rotation;
          digits = shapes.entry;
        } else if (t <= shared.gripClosed) {
          wrist = out.wrist(t - shared.reachStart);
          rotation = out.turn(t - shared.reachStart);
          digits = HumanPrehension.shape(
            shapes,
            peak,
            (t - shared.reachStart) / shared.reach,
          );
        } else if (t <= leave) {
          wrist = arrive;
          rotation = shared.receiverAt.rotation;
          digits = closed;
        } else {
          wrist = home.wrist(t - leave);
          rotation = home.turn(t - leave);
          digits = takes
            ? closed
            : HumanPrehension.shape(
                { entry: open, open: shapes.entry, closed: shapes.entry },
                1,
                minimumJerk((t - leave) / back).s,
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
              // The grasp's own arm solution anchors the hold and the
              // take-away, and the reach more and more as it arrives.
              ...(takes && t >= shared.gripClosed
                ? { reference: shared.receiverReference }
                : takes && t > shared.reachStart
                  ? {
                      reference: {
                        ...shared.receiverReference,
                        weight: minimumJerk(
                          (t - shared.reachStart) / shared.reach,
                        ).s,
                      },
                    }
                  : {}),
              ...(takes && t >= shared.gripClosed && t <= leave
                ? { planted: true }
                : {}),
            },
          },
        };
      },
    };
  }
}
