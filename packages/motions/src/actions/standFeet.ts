import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { stand } from "./stand";

/**
 * A quiet stance's feet, flattened by rolling about the displayed bearing
 * socket. The same contact determines its final ankle and the course to it.
 */
export namespace standFeet {
  /** A planted foot's flattening course. */
  export interface ICourse {
    /** Final ankle points, world metres. */
    flat: Record<AutoMovieHumanSide, IAutoMovieVector3>;
    /** Read both rockers once for one share; the caller owns the sample. */
    sample(share: number): ISample;
    /** Mean ankle displacement from the flat targets at share 0 to 1. */
    offset(share: number): IAutoMovieVector3;
    /** Write the feet and toes at a share, optionally carried by their support. */
    write(
      posture: IAutoMovieMotionHumanPosture,
      share: number,
      carry?: IAutoMovieMotionHumanSupportCarry.ICarry,
    ): IAutoMovieMotionHumanPosture;
  }

  /** One synchronous course reading, shared by root placement and its feet. */
  export interface ISample {
    /** Mean world-metre ankle displacement from the final flat targets. */
    offset: IAutoMovieVector3;

    /** Write the already read feet, optionally moved by the current support. */
    write(
      posture: IAutoMovieMotionHumanPosture,
      carry?: IAutoMovieMotionHumanSupportCarry.ICarry,
    ): IAutoMovieMotionHumanPosture;
  }

  /** One foot's fixed-contact evaluations. */
  interface IPlan {
    /** The foot. */
    side: AutoMovieHumanSide;
    /** The ankle and rotation at a share. */
    at(share: number): IAutoMovieMotionHumanFoot.IPlacement;
    /** Toe flexion, degrees, at a share. */
    toes(share: number): number;
    /** The bearing offset in the foot's frame. */
    contact(share: number): IAutoMovieVector3;
  }

  /** Fixed share-one geometry used by both flat targets and completed rockers. */
  interface ISettled {
    /** The final ankle and foot rotation in the world. */
    placement: IAutoMovieMotionHumanFoot.IPlacement;

    /** The final bearing offset in the foot's local frame, metres. */
    contact: IAutoMovieVector3;
  }

  /**
   * Build the foot course from the displayed entry.
   *
   * @param body The body.
   * @param entry The displayed state.
   * @param yaw The quiet heading, degrees.
   * @returns The contact-preserving foot course.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
    yaw: number,
  ): ICourse {
    const sides: readonly ["left", "right"] = ["left", "right"];
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const side of sides)
      if (entry.feet[side].planted)
        for (const socket of ["heel", "ball", "toe"] as const)
          requested.add(
            body.surfaces.sockets[
              `${socket}${side === "left" ? "Left" : "Right"}`
            ].bone,
          );
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
      undefined,
      requested,
    );
    const planted: AutoMovieHumanSide[] = sides.filter(
      (side: AutoMovieHumanSide): boolean => entry.feet[side].planted,
    );
    const socketsBySide: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.ISocket[]>
    > = {};
    for (const side of planted)
      socketsBySide[side] = HumanFoot.sockets(body, bones, side);
    const floor: number =
      planted.length === 0
        ? 0
        : Math.min(
            ...planted.flatMap((side: AutoMovieHumanSide): number[] =>
              socketsBySide[side]!.map(
                (s: IAutoMovieMotionHumanFoot.ISocket): number => s.point.y,
              ),
            ),
          );
    const plans: IPlan[] = sides.map((side: AutoMovieHumanSide): IPlan => {
      const heading: number =
        yaw + (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT);
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      const fallback: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: HumanFrame.point(
          { origin: { ...entry.posture.root, y: floor }, yaw },
          rest,
        ),
        rotation: HumanFoot.rotation(heading, 0),
      };
      if (!entry.feet[side].planted)
        return {
          side,
          at: (_: number): IAutoMovieMotionHumanFoot.IPlacement => fallback,
          toes: (_: number): number => 0,
          contact: (_: number): IAutoMovieVector3 =>
            HumanFoot.offset(body, side, "mtp"),
        };
      const sockets: IAutoMovieMotionHumanFoot.ISocket[] = socketsBySide[side]!;
      const pivot: IAutoMovieMotionHumanFoot.ISocket = sockets.reduce(
        (
          a: IAutoMovieMotionHumanFoot.ISocket,
          b: IAutoMovieMotionHumanFoot.ISocket,
        ): IAutoMovieMotionHumanFoot.ISocket => (b.point.y < a.point.y ? b : a),
      );
      const rotation: IAutoMovieQuaternion = entry.feet[side].rotation;
      // A planted foot keeps the heading it stands at: turned on the floor
      // about its bearing socket, the rest of a sole lying on the floor would
      // slide across it, so the stance's legs take the difference instead.
      const from: number = HumanFoot.heading(rotation);
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
        at: (share: number): IAutoMovieMotionHumanFoot.IPlacement => {
          const placement: IAutoMovieMotionHumanFoot.IPlacement =
            HumanFoot.pivot(
              body,
              side,
              pivot.socket,
              pivot.point,
              from,
              pitch * (1 - share),
              toes(share),
              roll * (1 - share),
            );
          return placement;
        },
        toes,
        contact: (share: number): IAutoMovieVector3 =>
          HumanFoot.offset(body, side, pivot.socket, toes(share)),
      };
    });
    const settled: ISettled[] = plans.map(
      (p: IPlan): ISettled => ({
        placement: p.at(1),
        contact: p.contact(1),
      }),
    );
    const flat: ICourse["flat"] = Object.fromEntries(
      plans.map((p: IPlan, i: number): [IPlan["side"], IAutoMovieVector3] => [
        p.side,
        { ...settled[i]!.placement.ankle },
      ]),
    ) as ICourse["flat"];
    const legged: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
      body,
      yaw,
    );
    const sample: ICourse["sample"] = (share: number): ISample => {
      const placed: IAutoMovieMotionHumanFoot.IPlacement[] = plans.map(
        (p: IPlan, i: number): IAutoMovieMotionHumanFoot.IPlacement =>
          share === 1
            ? {
                ankle: { ...settled[i]!.placement.ankle },
                rotation: { ...settled[i]!.placement.rotation },
              }
            : p.at(share),
      );
      return {
        offset: Vector3.scale(
          plans.reduce(
            (sum: IAutoMovieVector3, p: IPlan, i: number): IAutoMovieVector3 =>
              Vector3.add(
                sum,
                Vector3.subtract(placed[i]!.ankle, flat[p.side]),
              ),
            { x: 0, y: 0, z: 0 },
          ),
          0.5,
        ),
        write: (
          posture: IAutoMovieMotionHumanPosture,
          carry?: IAutoMovieMotionHumanSupportCarry.ICarry,
        ): IAutoMovieMotionHumanPosture => {
          const feet: ICourse["flat"] = Object.fromEntries(
            plans.map(
              (p: IPlan, i: number): [IPlan["side"], IAutoMovieVector3] => [
                p.side,
                carry?.point(placed[i]!.ankle) ?? placed[i]!.ankle,
              ],
            ),
          ) as ICourse["flat"];
          const limbs: IAutoMovieMotionHumanPosture["limbs"] =
            posture.yaw === yaw
              ? legged(posture.root, feet)
              : stand.legs(body, posture.root, posture.yaw, feet);
          const joints: IAutoMovieMotionHumanPosture["joints"] = {
            ...posture.joints,
          };
          for (let i: number = 0; i < plans.length; i++) {
            const p: IPlan = plans[i]!;
            const goal: IAutoMovieHumanLimbGoal = limbs[`${p.side}Leg`]!;
            limbs[`${p.side}Leg`] = {
              ...goal,
              rotation:
                carry === undefined
                  ? placed[i]!.rotation
                  : Quaternion.multiply(carry.turn, placed[i]!.rotation),
              contact:
                share === 1 ? { ...settled[i]!.contact } : p.contact(share),
            };
            joints[`${p.side}Toes`] = [p.toes(share), 0, 0];
          }
          return { ...posture, joints, limbs: { ...posture.limbs, ...limbs } };
        },
      };
    };
    return {
      flat,
      sample,
      offset: (share: number): IAutoMovieVector3 => sample(share).offset,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        share: number,
        carry?: IAutoMovieMotionHumanSupportCarry.ICarry,
      ): IAutoMovieMotionHumanPosture => sample(share).write(posture, carry),
    };
  }
}
