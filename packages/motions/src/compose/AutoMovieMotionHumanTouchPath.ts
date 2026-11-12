import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanTouchEffector } from "./AutoMovieMotionHumanTouchEffector";

/**
 * The free-space part of a touch: where the effector starts, the path it
 * takes from there to a surface region, when the hand turns on the way, and
 * the direction the hand lies on the region when the arm chooses it. Read by
 * the touch stroke (`AutoMovieMotionHumanTouch`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the questions the namespace answers and its reader.
 * @evidence contracts/development/design.md#principled-representation A via-direction curve, a turn shared with it and a projection, on the region's frame and the performer's shoulder; no region or body is named.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three provisional shares, the entry record and the functions the touch stroke reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the body's measures and the posture's floor frame; nothing is solved or stored.
 */
export namespace AutoMovieMotionHumanTouchPath {
  /** The share of the way to the region over which the arm's angles leave the entry's for the path's solution (provisional). */
  export const TAKE: number = 1 / 3;

  /** How far the path's control point stands off the region, a share of the straight way to it (provisional). */
  export const APPROACH: number = 1 / 3;

  /** The share of the way to the region from which the hand turns into the rotation that lays it there (provisional). */
  export const TURN: number = 1 / 2;

  /**
   * Where an effector is when a touch starts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its frame.
   * @evidence contracts/development/design.md#principled-representation A hand in free space is a point and a rotation, the two things a reach changes together.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, produced by `origin` and read by `goal`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members are world quantities of one pose, so no frame is mixed.
   */
  export interface IOrigin {
    /** The effector's point, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * An effector's origin on a pose.
   *
   * @param body The body.
   * @param bones The pose's resolved bones.
   * @param side The hand.
   * @param effector The effector.
   * @returns The origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The displayed effector and the displayed hand, read and not re-derived.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two reads.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The hand's own bone gives the rotation, whatever the effector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the effector's point.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function origin(
    body: IHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
    side: HumanHand.Side,
    effector: AutoMovieMotionHumanTouchEffector.IEffector,
  ): IOrigin {
    return {
      point: AutoMovieMotionHumanTouchEffector.point(
        body,
        bones,
        side,
        effector,
      ),
      rotation: bones.get(`${side}Hand`)!.worldRotation,
    };
  }

  /**
   * The arm's goal a share of the way to a region: the effector on the
   * approach path, and the hand as the arm carries it there with a neutral
   * wrist until `TURN` of the way, from where it turns into the rotation
   * that lays it on the region. A hand asked to hold its final rotation, or
   * any share of the turn toward it in the world, while still beside the hip
   * would bend the wrist to its limit and throw the elbow behind the trunk.
   *
   * @param body The body.
   * @param posture The posture so far.
   * @param side The hand.
   * @param from The effector's origin, carried to this posture.
   * @param laid The goal that lays the effector on the region at `to`.
   * @param to The effector's place on the region, world.
   * @param normal The region's unit normal.
   * @param share How far along the way, in [0, 1].
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves, what turns, when, why and each input.
   * @evidence contracts/development/implementation.md#principled-implementation A reach transports the hand with the wrist near neutral and orients it in the last part of the way (Jeannerod 1984; Desmurget et al. 1996), so the hand's rotation is read from the arm fitted to the path point alone and turned from there, never from the entry's world rotation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One path point, the laid arm as the reference, one fit for the carried rotation, one interpolation and one rigid offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts At the full share the laid goal is returned as it is, with no interpolation error; the rotation is always given, so the fit never switches between two kinds of goal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two extra limb fits per sampled second of the approach, none while the hand is on the region.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `approach`, the posture resolver and the laid goal's own contact offset.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function goal(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
    from: IOrigin,
    laid: IHumanPosture.IGoal,
    to: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    share: number,
  ): IHumanPosture.IGoal {
    const s: number = Math.min(1, Math.max(0, share));
    if (s >= 1 || laid.rotation === undefined) return laid;
    const contact: IAutoMovieVector3 = laid.contact ?? { x: 0, y: 0, z: 0 };
    const at: IAutoMovieVector3 = approach(
      body,
      posture,
      side,
      from.point,
      to,
      normal,
      s,
    );
    const wrist = (rotation: IAutoMovieQuaternion): IAutoMovieVector3 =>
      Vector3.subtract(at, Quaternion.rotateVector(rotation, contact));
    const fit = (arm: IHumanPosture.IGoal): IAutoMoviePose =>
      resolveHumanPosture(body, { ...posture, limbs: { [`${side}Arm`]: arm } });
    // The arm laid on the region is the reference of every fit on the way,
    // so the elbow keeps one side of the hand's path from start to arrival.
    const reference: IHumanPosture.IReference = resolveHumanPosture.reference(
      fit(laid),
      `${side}Arm`,
    );
    const { rotation: _, contact: __, ...free } = laid;
    const carried: IAutoMovieQuaternion = poseBones(
      body,
      fit({
        ...free,
        reference,
        point: wrist(Quaternion.slerp(from.rotation, laid.rotation, s)),
      }),
    ).get(`${side}Hand`)!.worldRotation;
    const u: number = Math.max(0, (s - TURN) / (1 - TURN));
    const rotation: IAutoMovieQuaternion = Quaternion.slerp(
      carried,
      laid.rotation,
      u * u * (3 - 2 * u),
    );
    return { ...laid, point: wrist(rotation), rotation, reference };
  }

  /**
   * A point of the effector's path to a region: a quadratic curve from the
   * entry place to the goal whose control point stands off the goal by
   * `APPROACH` of the straight way, along the region's normal less whatever
   * part of it faces away from the performer's own shoulder. A place on the
   * performer's own trunk is so approached along its normal, a partner's far
   * side from the performer's side of it, and the effector comes down onto
   * the surface instead of sliding along it.
   *
   * @param body The body.
   * @param posture The posture so far.
   * @param side The hand.
   * @param from The effector's entry place, world.
   * @param to The goal, world.
   * @param normal The region's unit normal.
   * @param share How far along the way, in [0, 1].
   * @returns The point, world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the curve, its control point and what it gives for an own and a partner's region.
   * @evidence contracts/development/implementation.md#principled-implementation A reach past an obstacle curves through a via point (Flash and Hogan 1985; Abend, Bizzi and Morasso 1982); the via direction is the surface's free side, kept on the half space the arm comes from so the path never asks the arm to reach around the surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One direction, one control point, one curve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No region or body is named; a normal that faces straight away from the shoulder falls back to the direction toward it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point` for the shoulder.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function approach(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: HumanHand.Side,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    share: number,
  ): IAutoMovieVector3 {
    const s: number = Math.min(1, Math.max(0, share));
    if (s >= 1) return to;
    const shoulder: IAutoMovieVector3 = HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      {
        x: (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth,
        y: 0,
        z: 0,
      },
    );
    const back: IAutoMovieVector3 = {
      x: shoulder.x - to.x,
      y: 0,
      z: shoulder.z - to.z,
    };
    const far: number = Vector3.length(back);
    const toward: IAutoMovieVector3 =
      far < 1e-6 ? { x: 0, y: 0, z: 0 } : Vector3.scale(back, 1 / far);
    const free: IAutoMovieVector3 = Vector3.subtract(
      normal,
      Vector3.scale(toward, Math.min(0, Vector3.dot(normal, toward))),
    );
    const off: IAutoMovieVector3 =
      Vector3.length(free) < 1e-6 ? toward : Vector3.normalize(free);
    const control: IAutoMovieVector3 = Vector3.add(
      to,
      Vector3.scale(off, APPROACH * Vector3.length(Vector3.subtract(to, from))),
    );
    return Vector3.add(
      Vector3.add(
        Vector3.scale(from, (1 - s) ** 2),
        Vector3.scale(control, 2 * s * (1 - s)),
      ),
      Vector3.scale(to, s * s),
    );
  }

  /**
   * The direction an effector's along axis lies on a region when the arm
   * chooses it: from the hanging elbow to the place, across the region's
   * normal. The hand then continues the forearm that reaches the place, so a
   * palm on the performer's own belly lies across it and one on a thigh
   * points down it.
   *
   * @param body The body.
   * @param posture The posture so far.
   * @param side The hand.
   * @param point The region's point, world.
   * @param normal The region's unit normal.
   * @param fallback The direction when the elbow's direction runs along the normal.
   * @returns The unit direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the direction, what it is read from and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation A hand laid on a surface keeps the wrist near neutral when its long axis continues the forearm; the forearm's direction is read from the elbow hanging under the shoulder, the place the elbow leaves least.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One elbow place and one projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A direction shorter than 0.3 of the way across the normal falls back, so a near-parallel direction is never normalised.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lay(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: HumanHand.Side,
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    fallback: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const elbow: IAutoMovieVector3 = HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      {
        x: (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth,
        y: body.measure.shoulderHeight - body.measure.upperArm,
        z: 0,
      },
    );
    const way: IAutoMovieVector3 = Vector3.subtract(point, elbow);
    const across: IAutoMovieVector3 = Vector3.subtract(
      way,
      Vector3.scale(normal, Vector3.dot(way, normal)),
    );
    return Vector3.length(across) > 0.3 * Vector3.length(way)
      ? Vector3.normalize(across)
      : fallback;
  }
}
