import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanSupportCarry } from "../carrier/HumanSupportCarry";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { stand } from "./stand";

/**
 * A quiet stance's feet, flattened by rolling about the displayed bearing
 * socket. The same contact determines its final ankle and the course to it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the contact datum and both consumers.
 * @evidence contracts/development/design.md#principled-representation A planted foot is a rigid rocker about one observed sole socket, with its toes' angle resolved in that bone's frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One course builder, its flat ankle points, offset and posture writer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads displayed sockets and uses HumanFoot.pivot, rather than subtracting a nominal ankle height.
 */
export namespace standFeet {
  /**
   * A planted foot's flattening course.
   * @evidence contracts/development/common.md#meaningful-documentation Documents each field's frame and share.
   * @evidence contracts/development/design.md#principled-representation The final ankle targets and the rigid-contact course are one plan.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The ankle targets, pelvis displacement and posture writer used by quiet standing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the shared posture, placement and carry types.
   */
  export interface ICourse {
    /** Final ankle points, world metres. */
    flat: Record<"left" | "right", IAutoMovieVector3>;
    /** Mean ankle displacement from the flat targets at share 0 to 1. */
    offset(share: number): IAutoMovieVector3;
    /** Write the feet and toes at a share, optionally carried by their support. */
    write(
      posture: IHumanPosture,
      share: number,
      carry?: HumanSupportCarry.ICarry,
    ): IHumanPosture;
  }

  /**
   * One foot's fixed-contact evaluations.
   * @evidence contracts/development/common.md#meaningful-documentation Each evaluator names its unit or frame.
   * @evidence contracts/development/design.md#principled-representation The same share places the ankle, articulates the toes and reads their contact offset.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the per-foot evaluations the paired course reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing foot placement and vector types.
   */
  interface IPlan {
    /** The foot. */
    side: "left" | "right";
    /** The ankle and rotation at a share. */
    at(share: number): HumanFoot.IPlacement;
    /** Toe flexion, degrees, at a share. */
    toes(share: number): number;
    /** The bearing offset in the foot's frame. */
    contact(share: number): IAutoMovieVector3;
  }

  /**
   * Build the foot course from the displayed entry.
   *
   * @param body The body.
   * @param entry The displayed state.
   * @param yaw The quiet heading, degrees.
   * @returns The contact-preserving foot course.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, units and result.
   * @evidence contracts/development/implementation.md#principled-implementation Each planted foot rolls about its lowest displayed sole socket; pitch, roll, heading and toe flexion approach their quiet values, and HumanFoot.pivot derives the ankle from that fixed contact at every share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the two contacts once, then evaluates the two rockers and their mean displacement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No ankle-height floor inference or contact translation is used for a planted foot.
   * @evidence contracts/development/implementation.md#efficient-algorithms One entry forward kinematics, then constant work per share.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work stand.plan and stand.feet read the same placed foot course; sitting does not consume it yet.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closures retain only the current body and two entry contacts for the plan's lifetime.
   */
  export function of(
    body: IHumanBody,
    entry: IHumanEntryState,
    yaw: number,
  ): ICourse {
    const sides: readonly ["left", "right"] = ["left", "right"];
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
    );
    const planted: ("left" | "right")[] = sides.filter(
      (side: "left" | "right"): boolean => entry.feet[side].planted,
    );
    const floor: number =
      planted.length === 0
        ? 0
        : Math.min(
            ...planted.flatMap((side: "left" | "right"): number[] =>
              HumanFoot.sockets(body, bones, side).map(
                (s: HumanFoot.ISocket): number => s.point.y,
              ),
            ),
          );
    const plans: IPlan[] = sides.map((side: "left" | "right"): IPlan => {
      const heading: number =
        yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT);
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      const fallback: HumanFoot.IPlacement = {
        ankle: HumanFrame.point(
          { origin: { ...entry.posture.root, y: floor }, yaw },
          rest,
        ),
        rotation: HumanFoot.rotation(heading, 0),
      };
      if (!entry.feet[side].planted)
        return {
          side,
          at: (_: number): HumanFoot.IPlacement => fallback,
          toes: (_: number): number => 0,
          contact: (_: number): IAutoMovieVector3 =>
            HumanFoot.offset(body, side, "mtp"),
        };
      const sockets: HumanFoot.ISocket[] = HumanFoot.sockets(body, bones, side);
      const pivot: HumanFoot.ISocket = sockets.reduce(
        (a: HumanFoot.ISocket, b: HumanFoot.ISocket): HumanFoot.ISocket =>
          b.point.y < a.point.y ? b : a,
      );
      const rotation: IAutoMovieQuaternion = entry.feet[side].rotation;
      const from: number = HumanFoot.heading(rotation);
      const turn: number =
        heading - from - 360 * Math.round((heading - from) / 360);
      const pitch: number = HumanFoot.pitch(rotation);
      const roll: number = HumanFoot.roll(rotation);
      const flexion: number =
        entry.pose.joints.find(
          (j: IAutoMovieJointPose): boolean => j.bone === `${side}Toes`,
        )?.flexion ?? 0;
      const toes: (share: number) => number = (share: number): number =>
        flexion * (1 - share);
      return {
        side,
        at: (share: number): HumanFoot.IPlacement =>
          HumanFoot.pivot(
            body,
            side,
            pivot.socket,
            pivot.point,
            from + turn * share,
            pitch * (1 - share),
            toes(share),
            roll * (1 - share),
          ),
        toes,
        contact: (share: number): IAutoMovieVector3 =>
          HumanFoot.offset(body, side, pivot.socket, toes(share)),
      };
    });
    const flat: ICourse["flat"] = Object.fromEntries(
      plans.map((p: IPlan): [IPlan["side"], IAutoMovieVector3] => [
        p.side,
        p.at(1).ankle,
      ]),
    ) as ICourse["flat"];
    return {
      flat,
      offset: (share: number): IAutoMovieVector3 =>
        Vector3.scale(
          plans.reduce(
            (sum: IAutoMovieVector3, p: IPlan): IAutoMovieVector3 =>
              Vector3.add(
                sum,
                Vector3.subtract(p.at(share).ankle, flat[p.side]),
              ),
            { x: 0, y: 0, z: 0 },
          ),
          0.5,
        ),
      write: (
        posture: IHumanPosture,
        share: number,
        carry?: HumanSupportCarry.ICarry,
      ): IHumanPosture => {
        const feet: ICourse["flat"] = Object.fromEntries(
          plans.map((p: IPlan): [IPlan["side"], IAutoMovieVector3] => [
            p.side,
            carry?.point(p.at(share).ankle) ?? p.at(share).ankle,
          ]),
        ) as ICourse["flat"];
        const limbs: IHumanPosture["limbs"] = stand.legs(
          body,
          posture.root,
          posture.yaw,
          feet,
        );
        const joints: IHumanPosture["joints"] = { ...posture.joints };
        for (const p of plans) {
          const goal: IHumanPosture.IGoal = limbs[`${p.side}Leg`]!;
          limbs[`${p.side}Leg`] = {
            ...goal,
            rotation:
              carry === undefined
                ? p.at(share).rotation
                : Quaternion.multiply(carry.turn, p.at(share).rotation),
            contact: p.contact(share),
          };
          joints[`${p.side}Toes`] = [p.toes(share), 0, 0];
        }
        return { ...posture, joints, limbs: { ...posture.limbs, ...limbs } };
      },
    };
  }
}
