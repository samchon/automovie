import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanGrasp } from "./HumanGrasp";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { pickUp } from "./pickUp";

/**
 * Setting a held prop down at a place and letting go.
 *
 * The goal is the prop's resting frame, not the hand: the author names
 * where the prop's origin goes (and optionally its heading), and the hand is
 * placed wherever holds the prop there, by the rigid hand-to-prop offset the
 * grip has kept since it closed (the prop's displayed frame and the hand's at
 * the start, so whatever the grasp was, the same grasp lays the prop down).
 * A prop is put down as it rested: its resting rotation is the one it was
 * declared with, turned about the vertical to the asked heading, so a bottle
 * carried at a tilt still lands upright. The arm keeps the configuration it
 * carried the prop in (`IHumanPosture.IGoal.reference`). Inverse kinematics solves the arm; the rest of the body holds the posture
 * it was entered in.
 *
 * Phases: a transport of the hand to the placing frame, timed by the
 * reach-to-grasp movement time over the travel (`HumanPrehension`), its last
 * 0.05 m straight down so the prop lands rather than slides (provisional
 * setback); the release, the fingers opening flat over 0.2 s (provisional) as
 * the grip ends, which leaves the prop where it was placed; and the hand's
 * return to where the arm hangs, rising the same 0.05 m first, over another
 * movement time.
 *
 * Events: `placed` when the prop reaches its frame, `release` when the grip
 * ends. The hand grips the prop until `release`. A placing frame beyond the
 * arm's reach is refused.
 */
export namespace putDown {
  /** The action's name. */
  export const name: HumanActionName = "putDown";

  /** Cancel table. */
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

    /** Where the prop's origin goes, world metres. */
    at: IAutoMovieVector3;

    /** The prop's heading about +Y at rest, degrees; its current heading when absent. */
    yaw?: number;

    /** The holding hand; `right` when absent. */
    hand?: HumanHand.Side;
  }

  /** The final vertical stretch of the placing transport, metres; provisional. */
  export const SETBACK: number = 0.05;

  /** Time the fingers take to open at the release, seconds; provisional. */
  export const OPEN: number = 0.2;

  /**
   * Plan a put down.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the placing frame lies beyond the arm's reach.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const side: HumanHand.Side = context.params.hand ?? "right";
    const body: IHumanBody = context.body;
    const held: IHumanPosture = context.entry.posture;

    // The hand-to-prop offset the grip keeps, from the displayed frames now.
    const hand: IAutoMovieResolvedBone = poseBones(
      body,
      context.entry.pose,
    ).get(
      `${side}Hand`,
    )!;
    const prop: IHumanProp.IFrame = context
      .prop(context.params.prop)
      .frame(context.start);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      hand.worldRotation,
    );
    const offset: IHumanProp.IFrame = {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(prop.position, hand.worldPosition),
      ),
      rotation: Quaternion.multiply(inverse, prop.rotation),
    };

    // The prop's resting frame, then the hand that holds it there.
    const heading = (q: IAutoMovieQuaternion): number => {
      const f: IAutoMovieVector3 = Quaternion.rotateVector(q, {
        x: 0,
        y: 0,
        z: 1,
      });
      return (Math.atan2(f.x, f.z) * 180) / Math.PI;
    };
    // A prop is put down as it rested: its declared rest rotation turned
    // about the vertical to the heading, never the tilt the carrying hand
    // happens to give it now.
    const authored: IAutoMovieQuaternion = context.prop(context.params.prop)
      .prop.frame.rotation;
    const holding = (yaw: number): HumanHand.IWrist => {
      const rest: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            yaw - heading(authored),
          ),
          authored,
        ),
      );
      const r: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(rest, Quaternion.inverse(offset.rotation)),
      );
      return {
        point: Vector3.subtract(
          context.params.at,
          Quaternion.rotateVector(r, offset.position),
        ),
        rotation: r,
      };
    };

    // An authored heading is kept; otherwise the prop may rest at whichever
    // heading the arm can lay it down at exactly.
    const bend: IAutoMovieVector3 = HumanHand.elbow(body, held, side);
    const chosen: HumanHand.IWrist =
      context.params.yaw === undefined
        ? HumanGrasp.reachable(
            body,
            held,
            side,
            bend,
            (turn: number): HumanHand.IWrist =>
              holding(heading(prop.rotation) + turn),
          ).wrist
        : holding(context.params.yaw);

    // The arm keeps the configuration it carried the prop in.
    const reference: IHumanPosture.IReference = resolveHumanPosture.reference(
      context.entry.pose,
      side === "left" ? "leftArm" : "rightArm",
    );
    const rotation: IAutoMovieQuaternion = chosen.rotation;
    const place: IAutoMovieVector3 = chosen.point;
    pickUp.reachable(context, side, place);

    // Timing: carry down, open, return.
    const hanging: IHumanPosture["limbs"] = { ...held.limbs };
    delete hanging[side === "left" ? "leftArm" : "rightArm"];
    const home: IAutoMovieResolvedBone = poseBones(
      body,
      resolveHumanPosture(body, { ...held, limbs: hanging }),
    ).get(`${side}Hand`)!;
    const down: number = HumanPrehension.duration(
      context.skill,
      context.random("place"),
      Vector3.length(Vector3.subtract(place, hand.worldPosition)),
      0,
    );
    const back: number = HumanPrehension.nominal(
      Vector3.length(Vector3.subtract(home.worldPosition, place)),
      0,
    );
    const duration: number = down + OPEN + back;
    const carry: HumanPrehension.ITransport = HumanPrehension.transport(
      hand.worldPosition,
      place,
      { x: 0, y: -1, z: 0 },
      SETBACK,
      { from: hand.worldRotation, to: rotation },
      down,
    );

    // The return is a placing transport played backwards: it leaves straight
    // up for the setback and ends at rest where the arm hangs.
    const retreat: HumanPrehension.ITransport = HumanPrehension.transport(
      home.worldPosition,
      place,
      { x: 0, y: -1, z: 0 },
      SETBACK,
      { from: home.worldRotation, to: rotation },
      back,
    );
    const closed: IHumanPosture["joints"] = HumanGrip.fingers(
      context.entry.pose,
      side,
    );
    const flat: IHumanPosture["joints"] = HumanHand.shape(side, "flat");
    const relaxed: IHumanPosture["joints"] = HumanHand.shape(side, "relaxed");
    const limb: IHumanPosture.Limb = side === "left" ? "leftArm" : "rightArm";
    const part: IHumanContactWindow["part"] =
      side === "left" ? "leftHand" : "rightHand";
    return {
      duration,
      events: [
        { name: "placed", share: down / duration },
        { name: "release", share: (down + OPEN) / duration },
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
          to: down / duration,
          support: { kind: "prop", subject: context.params.prop },
        },
      ],
      contact: down,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        let wrist: IAutoMovieVector3;
        let turned: IAutoMovieQuaternion;
        let digits: IHumanPosture["joints"];
        if (t <= down) {
          wrist = carry.wrist(t);
          turned = carry.turn(t);
          digits = closed;
        } else if (t <= down + OPEN) {
          wrist = place;
          turned = rotation;
          digits = HumanPrehension.shape(
            { entry: closed, open: flat, closed: flat },
            1,
            (t - down) / OPEN,
          );
        } else {
          const r: number = t - down - OPEN;
          wrist = retreat.wrist(back - r);
          turned = retreat.turn(back - r);
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
              rotation: turned,
              bend,
              reference,
              ...(t <= down ? { planted: true } : {}),
            },
          },
        };
      },
    };
  }
}
