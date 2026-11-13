import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The legs of a body seated on the floor with them folded: crossed in
 * front of it (tailor sitting), or both folded to its right with the
 * knees to its left and a hand on the floor at its left (side sitting).
 *
 * A folded leg is not a set of joint angles here but a place for its
 * ankle on the floor and a point its knee bends toward, which the leg
 * solve meets inside the hip's range: the thigh spreads by turning out as
 * it flexes. Places are in the pelvis's own frame on the floor, from the
 * point under the middle of the hip joints, in thigh lengths (`CROSSED`,
 * `SIDE`, all provisional: no measured foot placement of floor sitting was
 * read; Hemmerich et al. 2006, J Orthop Res 24:770, measure the knee of
 * cross-legged sitting near 130 to 150 degrees of flexion, which these
 * places give a leg of equal thigh and shank).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two sittings, why they are goals and not angles, the frame, the unit and that the shares are provisional.
 * @evidence contracts/development/design.md#principled-representation Ankle places and knee points in the pelvis's floor frame, scaled by the body's thigh, handed to the posture's limb goals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function and the two tables it reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No body is special-cased; every share is named and marked provisional.
 */
export namespace floorSeat {
  /** A folded sitting. */
  export type Kind = "crossed" | "side";

  /** A place in the pelvis's floor frame, from the floor point under the middle of the hip joints: to the body's left, up and ahead, thigh lengths. */
  export interface IPlace {
    /** To the body's left; negative to its right. */
    left: number;

    /** Above the floor. */
    up: number;

    /** Ahead of the hip joints. */
    ahead: number;
  }

  /** Tailor sitting, by leg: each ankle on the floor past the other hip, the left shank in front of the right, each knee out, ahead and a little up (provisional). */
  export const CROSSED: Readonly<
    Record<"left" | "right", { ankle: IPlace; knee: IPlace }>
  > = {
    left: {
      ankle: { left: -0.55, up: 0, ahead: 0.45 },
      knee: { left: 1.1, up: 0.35, ahead: 0.9 },
    },
    right: {
      ankle: { left: 0.55, up: 0, ahead: 0.25 },
      knee: { left: -1.1, up: 0.35, ahead: 0.9 },
    },
  };

  /** Side sitting, by leg: both ankles to the right, the left one ahead of the right hip and the right one out beside it, both knees ahead and to the left, low (provisional). */
  export const SIDE: Readonly<
    Record<"left" | "right", { ankle: IPlace; knee: IPlace }>
  > = {
    left: {
      ankle: { left: -0.3, up: 0, ahead: 0.4 },
      knee: { left: 1.2, up: 0.1, ahead: 0.8 },
    },
    right: {
      ankle: { left: -0.9, up: 0, ahead: -0.1 },
      knee: { left: 0.4, up: 0.1, ahead: 1 },
    },
  };

  /** How far out from the left shoulder the supporting hand of side sitting is set on the floor, thigh lengths (provisional). */
  export const HAND: number = 0.25;

  /** The height of a folded leg's ankle joint over the floor, in standing ankle heights: the foot lies on its side, so the joint is about half the ankle's breadth up (provisional). */
  export const ANKLE: number = 0.5;

  /**
   * A posture's legs moved a share of the way from where its joints hold
   * them to a folded sitting, and for side sitting its left hand to the
   * floor.
   *
   * @param body The body.
   * @param posture The posture, its root placed and its legs set by joints.
   * @param kind The sitting.
   * @param share 0 where the joints hold the legs to 1 folded.
   * @returns The posture with the leg goals, and the hand's for side sitting; the posture itself at no share. The hand bears (`planted`) once it is down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves, from where to where, and when the hand bears.
   * @evidence contracts/development/implementation.md#principled-implementation Each ankle and each knee's bend point travel a straight line from where the posture's own joints put them, so the legs are continuous with the joint posture at no share, to places on the floor the leg solve then meets inside the joints' ranges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward-kinematics pass, one frame, one pass over the legs and the hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A place out of a leg's reach is not checked here: the limb fit leaves the ankle short of it, which the contact audit reports.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One forward-kinematics pass and constant work per limb.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function place(
    body: IHumanBody,
    posture: IHumanPosture,
    kind: Kind,
    share: number,
  ): IHumanPosture {
    if (share <= 0) return posture;
    const s: number = Math.min(1, share);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, { ...posture, limbs: {} }),
    );
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      bones.get(bone)!.worldPosition;
    const hips: Record<"left" | "right", IAutoMovieVector3> = {
      left: at("leftUpperLeg"),
      right: at("rightUpperLeg"),
    };
    const thigh: number = body.measure.thigh;
    const frame: HumanFrame.IFrame = {
      origin: {
        x: (hips.left.x + hips.right.x) / 2,
        y: 0,
        z: (hips.left.z + hips.right.z) / 2,
      },
      yaw: posture.yaw,
    };
    const world = (p: IPlace, up: number): IAutoMovieVector3 =>
      HumanFrame.point(frame, {
        x: p.left * thigh,
        y: p.up * thigh + up,
        z: p.ahead * thigh,
      });
    const table: Readonly<
      Record<"left" | "right", { ankle: IPlace; knee: IPlace }>
    > = kind === "crossed" ? CROSSED : SIDE;
    const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
    for (const side of ["left", "right"] as const)
      limbs[`${side}Leg`] = {
        point: Vector3.lerp(
          at(`${side}Foot`),
          world(table[side].ankle, ANKLE * body.measure.ankleHeight),
          s,
        ),
        bend: Vector3.lerp(
          at(`${side}LowerLeg`),
          world(table[side].knee, 0),
          s,
        ),
      };
    if (kind === "side") {
      const hand: IAutoMovieResolvedBone = bones.get("leftHand")!;
      const shoulder: IAutoMovieVector3 = HumanFrame.local(
        frame,
        at("leftUpperArm"),
      );
      limbs.leftArm = {
        point: Vector3.lerp(
          hand.worldPosition,
          HumanFrame.point(frame, {
            x: shoulder.x + HAND * thigh,
            y: 0.2 * body.measure.hand,
            z: shoulder.z,
          }),
          s,
        ),
        rotation: Quaternion.slerp(
          hand.worldRotation,
          HumanHand.rotation("left", {
            fingers: HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
              { x: 1, y: 0, z: 0 },
            ),
            palm: { x: 0, y: -1, z: 0 },
          }),
          s,
        ),
        bend: AutoMovieMotionHumanBend.hang(body, posture, "left", 0.2),
        planted: s >= 1,
      };
    }
    return { ...posture, limbs };
  }
}
