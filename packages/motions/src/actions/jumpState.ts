import {
  type IAutoMovieResolvedBone,
  clampPose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanSegmentPlant } from "../perform/HumanSegmentPlant";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Canonical endpoint data shared by the jump's free-flight shape and COM.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish the achieved world root, clinical joints and root-local leg geometry with their units.
 * @evidence contracts/development/design.md#principled-representation A canonical pose and small achieved-leg records preserve the state actually fitted, independently of raw goal requests.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The jump retains only its achieved endpoints; no alternate pose solver or transition representation is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses canonical pose, posture joints and interface vectors/quaternions without a body-specific flag or sampled-frame cache.
 */
export namespace jumpState {
/**
 * Read a jump phase's achieved canonical endpoint, including its ordinary
 * final clamp and planted refit, before a free phase inherits that shape.
 * This reads the law's own posture, not arbitrary composed overlays or cuts.
 *
 * @param body The actual unchanged body.
 * @param posture The law's already lowered raw endpoint.
 * @returns Owned canonical joint values and root-local achieved foot/knee geometry.
 * @throws {Error} When preparation is attempted after a whole-body flight rotation or without a physical canonical root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates raw endpoint demand, achieved canonical shape and root-local geometry; limits the scope to the action's own posture.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the ordinary resolver, the declared rig's clamp and the existing final planted-refit owner, then reads actual FK with its rigid root removed. A free phase starts from achieved geometry rather than a separately reconstructed ankle/pitch request.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve and finalize once, admit its root, then copy clinical joints and the two legs' achieved root-frame geometry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not move or certify the original planted goal, change a range, drop a contact solve or fake a plant in flight. Original push/landing targets remain authored and audited independently.
 * @evidence contracts/development/implementation.md#efficient-algorithms One existing canonical resolution, clamp and planted refit remain per endpoint, followed by full joint admission/copy and FK only for the four ankle/knee bones' ancestor closure. Endpoints prepare once per plan and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanSegmentPlant's actual policy rather than duplicating its planted filter, and each FK map supplies foot and knee geometry together.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned pose, joint table and small leg records belong to this plan; temporary bone maps release on return. No reader, callback, global memo or body handle is added to the result.
 */
export function of(body: IHumanBody, posture: IHumanPosture): jumpState.IState {
  if (posture.rotation !== undefined)
    throw new Error("Jump endpoint preparation precedes whole-body flight rotation");
  const resolved: IAutoMoviePose = resolveHumanPosture(body, posture);
  const clamped: IAutoMoviePose = clampPose(resolved, body.skeleton);
  const pose: IAutoMoviePose = HumanSegmentPlant.fit(body, clamped, posture.limbs).pose;
  if (pose.root === null) throw new Error("A jump endpoint requires its physical root");
  const joints: IHumanPosture["joints"] = {};
  for (const joint of pose.joints)
    joints[joint.bone] = [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0];
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, { ...pose, root: null }, undefined, LEG_BONES);
  const leg: (side: "left" | "right") => jumpState.ILeg = (
    side: "left" | "right",
  ): jumpState.ILeg => {
    const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
    return {
      point: { ...foot.worldPosition },
      rotation: { ...foot.worldRotation },
      bend: { ...bones.get(`${side}LowerLeg`)!.worldPosition },
    };
  };
  return {
    pose,
    root: { ...pose.root.translation },
    joints,
    legs: { left: leg("left"), right: leg("right") },
  };
}

/** Only achieved ankles and knees are consumed after full canonical endpoint resolution. */
const LEG_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "leftFoot", "rightFoot", "leftLowerLeg", "rightLowerLeg",
]);

  /**
   * One achieved leg in the canonical root frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Point and knee pole are root-frame metres; rotation is the achieved unit foot quaternion in that frame.
   * @evidence contracts/development/design.md#principled-representation Actual FK supplies the ankle, middle joint and end rotation of one physical chain.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The free goal uses all three fields; no world support is asserted.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Stores achieved geometry rather than replacing it with rest lengths or requested foot angles.
   */
  export interface ILeg {
    /** Achieved ankle, root-frame metres. */
    point: IAutoMovieVector3;
    /** Achieved knee used as its free bend pole, root-frame metres. */
    bend: IAutoMovieVector3;
    /** Achieved foot rotation in the root frame. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * One finalized source state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the canonical pose, physical world root, clinical-degree table and two root-frame legs.
   * @evidence contracts/development/design.md#principled-representation Carries both the actual canonical pose used for mass and the compact geometry used for free limb goals.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four fields serve the ballistic COM and free-flight shape boundaries.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps pose and articulation from the actual resolver instead of claiming raw target equality certifies a canonical state.
   */
  export interface IState {
    /** Actual finalized canonical pose. */
    pose: IAutoMoviePose;
    /** World root translation, metres. */
    root: IAutoMovieVector3;
    /** Achieved clinical angles, degrees; neutral nulls read as zero. */
    joints: IHumanPosture["joints"];
    /** Achieved geometry of both legs in the canonical root frame. */
    legs: Record<"left" | "right", ILeg>;
  }
}
