import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { hipJoints } from "../../posture/internal/hipJoints";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import type { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { HumanTrunk } from "./HumanTrunk";

/*
 * A crouch's legs at a share of the descent (`crouch.plan`): the shank's and
 * the thigh's tilts moving together, the heel risen about the toes' joint by
 * what the ankle's range leaves, the feet pivoted there, the hip joints over
 * each ankle from the leg's two lengths, and the trunk inclined and tipped on
 * the moved root. Read from the plan's body, heading, heels, tilts and standing
 * posture.
 * Parameter scope: What the plan's legs are read from.
 * Returns: The posture at a share for each inclination.
 */
export function crouchLegs(scope: crouchLegs.IScope): crouchLegs.AtShare {
  const {
    body,
    m,
    yaw,
    heel,
    dorsiflexion,
    shankTilt,
    thighTilt,
    standing,
  }: crouchLegs.IScope = scope;
  // The leg's angles move together over the descent, the shank's tilt and
  // the thigh's each by its share, so the ankle never passes the crouching
  // ankle: it takes the shank's tilt until it reaches it, and the heel rises
  // about the toes' joint by the rest.
  const lift: (s: number) => number = (s: number): number =>
    Math.max(0, shankTilt * s - dorsiflexion);
  const heading: IAutoMovieQuaternion = HumanFrame.turn(yaw);
  const sockets: Record<AutoMovieHumanSide, IAutoMovieVector3> | undefined =
    heel === 0
      ? undefined
      : {
          left: HumanFoot.offset(body, "left", "mtp"),
          right: HumanFoot.offset(body, "right", "mtp"),
        };

  // The feet at a share of the descent: each pivots about its toes' joint
  // by the heel's lift there.
  const placements: (
    posture: IAutoMovieMotionHumanPosture,
    s: number,
  ) => Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> = (
    posture: IAutoMovieMotionHumanPosture,
    s: number,
  ): Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> => {
    const foot: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.IPlacement => {
      const goal: IAutoMovieHumanLimbGoal = posture.limbs[`${side}Leg`]!;
      const flat: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: goal.point,
        rotation: goal.rotation ?? heading,
      };
      const socket: IAutoMovieVector3 | undefined = sockets?.[side];
      return socket === undefined
        ? flat
        : HumanFoot.pivot(
            body,
            side,
            socket,
            Vector3.add(
              flat.ankle,
              Quaternion.rotateVector(flat.rotation, socket),
            ),
            HumanFoot.heading(flat.rotation),
            -lift(s),
          );
    };
    return { left: foot("left"), right: foot("right") };
  };
  const feet: (
    posture: IAutoMovieMotionHumanPosture,
    placed: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
  ) => IAutoMovieMotionHumanPosture["limbs"] = (
    posture: IAutoMovieMotionHumanPosture,
    placed: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
  ): IAutoMovieMotionHumanPosture["limbs"] => {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const)
      limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
        body,
        posture,
        side,
        placed[side],
        true,
      );
    return limbs;
  };

  // The hip joints over each ankle at a share, from the leg's two lengths
  // at the share's tilts, averaged over the two legs. The standing legs
  // stand a little off the straight vertical leg this places at the start;
  // that difference is carried in by the share, so the root starts where
  // the standing posture puts it and ends where the leg's geometry does.
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw },
    { x: 0, y: 0, z: 1 },
  );
  const rad: (deg: number) => number = (deg: number): number =>
    (deg * Math.PI) / 180;
  const joints: ReturnType<typeof hipJoints> = hipJoints(
    body,
    standing.root,
    heading,
  );
  const over: (
    s: number,
    placed?: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
  ) => IAutoMovieVector3 = (
    s: number,
    placed: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = placements(standing, s),
  ): IAutoMovieVector3 => {
    const shank: number = rad(shankTilt * s);
    const thigh: number = rad(thighTilt * s);
    const vertical: IAutoMovieVector3 = {
      x: 0,
      y: m.shank * Math.cos(shank) + m.thigh * Math.cos(thigh),
      z: 0,
    };
    const horizontal: IAutoMovieVector3 = Vector3.scale(
      forward,
      m.shank * Math.sin(shank) - m.thigh * Math.sin(thigh),
    );
    let out: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const side of ["left", "right"] as const) {
      const hip: IAutoMovieVector3 = Vector3.add(
        Vector3.add(placed[side].ankle, vertical),
        horizontal,
      );
      out = Vector3.add(
        out,
        Vector3.scale(Vector3.subtract(hip, joints[side]), 0.5),
      );
    }
    return out;
  };
  const start: IAutoMovieVector3 = over(0);
  const move: (
    s: number,
    placed?: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
  ) => IAutoMovieVector3 = (
    s: number,
    placed?: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
  ): IAutoMovieVector3 =>
    Vector3.add(
      Vector3.subtract(over(s, placed), start),
      Vector3.scale(start, s),
    );

  /*
   * Bind fixed raw geometry for one share; every inclination still tips the
   * trunk and writes actual current-root knee goals.
   */
  function atShare(
    posture: IAutoMovieMotionHumanPosture,
    s: number,
  ): (
    inclination: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieMotionHumanPosture {
    // Moving and tipping the root leave these raw leg goals unchanged.
    // Share only their current placements, rebuilding the actual knees below.
    const placed: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = placements(posture, s);
    const moved: IAutoMovieMotionHumanPosture = {
      ...posture,
      root: Vector3.add(
        posture.root,
        move(s, posture === standing ? placed : undefined),
      ),
    };
    const limit: number = HumanTrunk.pelvisLimit(body, moved.root, yaw, {
      left: placed.left.ankle,
      right: placed.right.ankle,
    });
    return (
      inclination: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    ): IAutoMovieMotionHumanPosture => {
      const inclined: ReturnType<typeof HumanTrunk.incline> =
        HumanTrunk.incline(moved.joints, inclination, limit);
      const tipped: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.tip(
        body,
        { ...moved, joints: inclined.joints },
        inclined.pitch,
        0,
      );
      const toes: readonly [number, number, number] = [
        heel === 0 ? 0 : lift(s),
        0,
        0,
      ];
      return lowerHumanPosture(
        body,
        {
          ...tipped,
          joints:
            heel === 0
              ? tipped.joints
              : { ...tipped.joints, leftToes: toes, rightToes: [...toes] },
          limbs: feet(tipped, placed),
        },
        undefined,
        resolution,
      );
    };
  }

  return atShare;
}

/*
 * What a crouch's legs read and what they are.
 */
export namespace crouchLegs {
  /*
   * What a crouch plan reads its legs from.
   */
  export interface IScope {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The body's measure.
     */
    m: IAutoMovieMotionHumanBody["measure"];

    /*
     * The standing heading, degrees.
     */
    yaw: number;

    /*
     * The heel lift about the toes' joint, degrees; zero for flat heels.
     */
    heel: number;

    /*
     * The crouching ankle's dorsiflexion, degrees.
     */
    dorsiflexion: number;

    /*
     * The shank's tilt at the lowest pose, degrees.
     */
    shankTilt: number;

    /*
     * The thigh's tilt at the lowest pose, degrees.
     */
    thighTilt: number;

    /*
     * The standing posture.
     */
    standing: IAutoMovieMotionHumanPosture;
  }

  /*
   * The raw geometry bound for one share, read at an inclination.
   * Parameter posture: The posture the share is written on.
   * Parameter s: The descent's share.
   * Returns: The posture at an inclination.
   */
  export type AtShare = (
    posture: IAutoMovieMotionHumanPosture,
    s: number,
  ) => (
    inclination: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ) => IAutoMovieMotionHumanPosture;
}
