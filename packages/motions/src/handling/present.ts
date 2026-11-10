import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";

/**
 * A pad holder presenting a held pad to a striker: the pad's face is
 * brought to the height the strike aims at, in front of the holder and turned
 * to face the striker, so that it is there when the striker's named event
 * (a strike's commit or impact) comes, and held through it.
 *
 * The goal is the pad's face, not the arm: the author names the pad's point
 * (its striking face, a prop point with an outward normal), the striker and
 * the event to be ready by. The face goes to the holder's own centre line,
 * a forearm and a hand ahead of the holding shoulder (a bent-elbow hold that
 * can brace against the blow), at the line's height on the holder's body:
 * `high` the chin, `middle` the chest, `low` the hip; and its normal turns to
 * point at the striker's chest. The hand is placed wherever holds the pad
 * there, by the rigid hand-to-pad offset the hold has kept, and inverse
 * kinematics solves the arm.
 *
 * Timing: the pad arrives at the presenting place by the striker's event
 * less a lead, held still through the event and a follow-through, then
 * returns to where the hand started. The transport is the reach-to-grasp
 * movement time over its travel, starting so the arrival leads the event;
 * the lead is 0.15 s and the follow-through 0.3 s, provisional values (pad
 * holders present just before the strike lands; no measured lead was
 * located). An event that comes sooner than the transport needs is refused
 * with both times.
 *
 * Events: `presented` when the pad is in place, `released` when the hold
 * ends and the pad returns. The hand grips the pad throughout (taking over
 * the hold), so the pad rides the hand.
 */
export namespace present {
  /** The action's name. */
  export const name: HumanActionName = "present";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: ["released", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.3,
        keep: ["grip"],
      },
    ],
    present: [
      {
        window: ["released", 1],
        kind: "inertialize",
        entry: 0,
        blend: 0.2,
        keep: ["grip"],
      },
    ],
  };

  /** Parameters. */
  export interface IParams {
    /** The held pad's subject id. */
    prop: string;

    /** The pad's face, a point of the prop. */
    face: string;

    /** The striker's subject id. */
    to: string;

    /** The striker's action anchor and the event the pad must be ready by. */
    by: { anchor: string; event: string };

    /** The strike's line; `middle` when absent. */
    line?: "low" | "middle" | "high";

    /** The holding hand; `right` when absent. */
    hand?: HumanHand.Side;
  }

  /** How long before the event the pad arrives, seconds; provisional. */
  export const LEAD: number = 0.15;

  /** How long the pad stays presented after the event, seconds; provisional. */
  export const FOLLOW: number = 0.3;

  /**
   * Plan a presentation.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the event comes sooner than the pad can arrive, or the face is not a point of the prop.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const side: HumanHand.Side = context.params.hand ?? "right";
    const body: IHumanBody = context.body;
    const held: IHumanPosture = context.entry.posture;
    const pad: IHumanActionContext.IProp = context.prop(context.params.prop);
    const face = pad.prop.points[context.params.face];
    if (face === undefined)
      throw new Error(
        `Prop ${context.params.prop} has no point ${context.params.face}`,
      );

    // The hand-to-pad offset the hold keeps.
    const hand: IAutoMovieResolvedBone = new Map(
      resolvePose(
        context.entry.pose,
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
        body.topology,
      ).map((r): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
        r.bone,
        r,
      ]),
    ).get(`${side}Hand`)!;
    const frame: IHumanProp.IFrame = pad.frame(context.start);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hand.worldRotation,
    );
    const offset: IHumanProp.IFrame = {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(frame.position, hand.worldPosition),
      ),
      rotation: Quaternion.multiply(inverse, frame.rotation),
    };

    // Where the face goes and which way it faces.
    const trunk = HumanTrunk.resolve(body, held);
    const shoulder: IAutoMovieVector3 = trunk.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const ahead: number = body.measure.forearm + body.measure.hand;
    const height: number = {
      high: body.measure.headHeight - 2 * body.measure.headRadius * 0.6,
      middle: body.measure.chestHeight,
      low: body.measure.hipHeight,
    }[context.params.line ?? "middle"];
    const root: IAutoMovieVector3 = held.root;
    const spot: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: root.x, y: 0, z: root.z }, yaw: held.yaw },
      {
        x: 0,
        y: height,
        z:
          HumanFrame.local(
            { origin: { x: root.x, y: 0, z: root.z }, yaw: held.yaw },
            shoulder,
          ).z + ahead,
      },
    );
    const striker: IAutoMovieVector3 = context.aim(
      { kind: "person", subject: context.params.to, region: "sternum" },
      context.start,
    ).point;
    const toward: IAutoMovieVector3 = Vector3.normalize({
      x: striker.x - spot.x,
      y: 0,
      z: striker.z - spot.z,
    });
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      face.normal,
    );
    const swing: IAutoMovieQuaternion = aim(
      Vector3.normalize({ x: normal.x, y: 0, z: normal.z }),
      toward,
    );
    const padTurn: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(swing, frame.rotation),
    );
    const padAt: IAutoMovieVector3 = Vector3.subtract(
      spot,
      Quaternion.rotateVector(padTurn, face.point),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(padTurn, Quaternion.inverse(offset.rotation)),
    );
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      padAt,
      Quaternion.rotateVector(rotation, offset.position),
    );

    // Ready by the striker's event less the lead.
    const strike: IHumanActionContext.IPlaced = context.action(
      context.params.by.anchor,
    );
    const share: number | undefined = strike.plan.events.find(
      (e) => e.name === context.params.by.event,
    )?.share;
    if (share === undefined)
      throw new Error(
        `${context.subject}: ${context.params.by.anchor} has no event ${context.params.by.event}`,
      );
    const event: number =
      strike.start + share * strike.plan.duration - context.start;
    const travel: number = HumanPrehension.nominal(
      Vector3.length(Vector3.subtract(wrist, hand.worldPosition)),
      0,
    );
    const arrive: number = event - LEAD;
    if (arrive < travel)
      throw new Error(
        `${context.subject}: the pad needs ${travel.toFixed(3)} s to be presented, but ${context.params.by.event} comes ${event.toFixed(3)} s after the presentation starts; start it earlier`,
      );
    const depart: number = arrive - travel;
    const leave: number = event + FOLLOW;
    const duration: number = leave + travel;
    const out: HumanPrehension.ITransport = HumanPrehension.transport(
      hand.worldPosition,
      wrist,
      { x: 0, y: 0, z: 0 },
      0,
      { from: hand.worldRotation, to: rotation },
      travel,
    );
    const home: HumanPrehension.ITransport = HumanPrehension.transport(
      wrist,
      hand.worldPosition,
      { x: 0, y: 0, z: 0 },
      0,
      { from: rotation, to: hand.worldRotation },
      travel,
    );
    const fingers: IHumanPosture["joints"] = HumanGrip.fingers(
      context.entry.pose,
      side,
    );
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    const part: IHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    return {
      duration,
      events: [
        { name: "presented", share: arrive / duration },
        { name: "released", share: leave / duration },
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
          to: 1,
          support: { kind: "prop", subject: context.params.prop },
        },
      ],
      holds: [{ side, prop: context.params.prop, from: 1, fingers }],
      contact: arrive,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const point: IAutoMovieVector3 =
          t <= depart
            ? hand.worldPosition
            : t <= arrive
              ? out.wrist(t - depart)
              : t <= leave
                ? wrist
                : home.wrist(t - leave);
        const turn: IAutoMovieQuaternion =
          t <= depart
            ? hand.worldRotation
            : t <= arrive
              ? out.turn(t - depart)
              : t <= leave
                ? rotation
                : home.turn(t - leave);
        return {
          ...held,
          joints: { ...held.joints, ...fingers },
          limbs: {
            ...held.limbs,
            [limb]: {
              point,
              rotation: turn,
              bend: HumanHand.elbow(body, held, side),
              ...(t > arrive && t <= leave ? { planted: true } : {}),
            },
          },
        };
      },
    };
  }
}

/** The turn about +Y that takes one horizontal direction onto another. */
function aim(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const angle: number =
    (Math.atan2(from.z * to.x - from.x * to.z, from.x * to.x + from.z * to.z) *
      180) /
    Math.PI;
  return Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, angle);
}
