import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  resolveAutoMovieHumanoidSurfaces,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The trunk and head of a posture placed in the world without solving its
 * limbs: forward kinematics of the root and the directly set joints only.
 *
 * The pelvis, spine, chest, neck, head, eyes, shoulder girdles and the
 * regions they carry (the face, the chest, the back, the hips' pockets)
 * depend only on the root and the joints a posture sets, never on its limb
 * goals, because inverse kinematics moves the limbs alone. So a gaze, a
 * self-touch or a hand rest can read where the face or the hip is from the
 * posture directly, at the cost of one forward-kinematics pass and none of
 * the limb fits. Limb bones in the result stand at their set or clinical-zero
 * angles and must not be read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which bones are valid and why limbs are skipped.
 * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the canonical rig with the posture's root rotation, as `resolveHumanPosture` builds it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One resolvePose pass, linear in bones.
 */
export namespace HumanTrunk {
  /**
   * World bones of a posture's trunk and head.
   *
   * @param body The body.
   * @param posture The posture; its limb goals are ignored.
   * @param joints Joints to use instead of the posture's; the posture's when absent.
   * @returns Resolved bones; the trunk, head, eyes and shoulder girdles are valid.
   */
  export function resolve(body: IHumanBody, posture: IHumanPosture, joints: IHumanPosture["joints"] = posture.joints): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const list: IAutoMovieJointPose[] = (Object.entries(joints) as [AutoMovieHumanoidBone, readonly [number, number, number]][]).map(
      ([bone, a]): IAutoMovieJointPose => ({ bone, flexion: a[0], abduction: a[1], twist: a[2] }),
    );
    return new Map(
      resolvePose(
        {
          skeleton: body.skeleton.id,
          root: { translation: posture.root, rotation: resolveHumanPosture.heading(posture), scale: { x: 1, y: 1, z: 1 } },
          joints: list,
        },
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).map((r: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r]),
    );
  }

  /**
   * A trunk or head region's world point and outward normal on a posture.
   *
   * @param body The body.
   * @param posture The posture.
   * @param region A region riding the trunk, the head or the hips (not a limb below the hip or shoulder).
   * @returns The point (metres) and the unit normal.
   */
  export function region(body: IHumanBody, posture: IHumanPosture, region: AutoMovieHumanoidRegion): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } {
    const frame = body.surfaces.regions[region];
    const placed = resolveAutoMovieHumanoidSurfaces.place(frame, resolve(body, posture).get(frame.bone)!);
    return { point: placed.point, normal: placed.normal };
  }
}
