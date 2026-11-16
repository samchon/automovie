import {
  AutoMovieHumanoidBone,
  IAutoMovieAttachment,
  IAutoMovieJointAxes,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { resolvePose } from "./resolvePose";
import type { prepareSkeletonPoseResolution } from "./prepareSkeletonPoseResolution";
import type { preparePoseResolution } from "./preparePoseResolution";

/**
 * The transform of a child model's root rigidly coupled to one bone of a posed
 * parent skeleton, in the parent skeleton's model space: a rider on a horse, a
 * sword in a hand, a passenger in a cart.
 *
 * The parent pose is resolved by forward kinematics ({@link resolvePose}) and
 * the attachment offset is composed into the bone's frame:
 *
 * - `translation = boneWorldPos + boneWorldRot · offset.translation`
 * - `rotation = boneWorldRot ∘ offset.rotation`
 * - `scale = offset.scale`, copied
 *
 * The child follows both where the bone is and how it is turned, as a physics
 * fixed joint carries one body on another. Feed the result to the child as its
 * root each frame.
 *
 * Throws when the bone is not among the resolved bones, because it is not
 * declared or not reachable from a root: a mis-wired attachment is a defect,
 * not a frame to skip. `jointAxes` and `restFrames` must match the renderer's
 * pose path, or the child rides a different pose than the visible parent.
 *
 * @param parentPose Pose of the parent skeleton.
 * @param parentSkeleton Rig the pose articulates.
 * @param attachment Bone to ride and the child's offset in that bone's frame.
 * @param jointAxes Per-bone clinical axes for forward kinematics.
 * @param restFrames Per-bone rest frames for reading the pose as clinical.
 * @param prepared Optional genuine fixed demand for this exact parent rig/mappings and attachment bone; omission retains raw full FK.
 * @param resolution Optional exact reader borrowed from the synchronous bake, never retained here.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Rigid composition of the bone's resolved world frame with the offset transform, the fixed-joint relation; it premises unit-length rotations and treats the bone frame as unscaled, since a resolved bone carries no scale, so the offset's scale passes through unchanged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses raw resolvePose or the genuine same-rig prepared demand for FK, then keeps one attachment-offset composition. compileAttach supplies the actual prepared producer only for its explicit immutable-parent path; no private chain formula is duplicated.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unresolvable bone throws instead of falling back to the root or skipping the frame, and no rig or bone is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation States output frame, offset composition, missing-bone refusal, matching renderer mappings and explicit prepared-demand/operation ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms Raw omission retains O(J+B) complete admission/FK and a B-bone lookup. Explicit prepared demand still admits J records but computes only demanded ancestry and returns the requested bone before constant offset composition. An optional reader shares exact completed math; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller may supply this exact parent rig/mapping's genuine immutable demand and same-bake operation reader; only static indices and actual scalar FK dependencies share. Every current pose remains admitted and the returned attachment transform stays fresh, without a pose/target cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the resolved bones are local to the call and the returned transform, including its copied scale, is owned by the caller.
 */
export const resolveAttachment: (
  parentPose: IAutoMoviePose,
  parentSkeleton: IAutoMovieSkeleton,
  attachment: IAutoMovieAttachment,
  jointAxes?:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined,
  restFrames?:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
    | undefined,
  prepared?: prepareSkeletonPoseResolution.IBoneDemand,
  resolution?: ReturnType<typeof preparePoseResolution>,
) => IAutoMovieTransform = (
  parentPose: IAutoMoviePose,
  parentSkeleton: IAutoMovieSkeleton,
  attachment: IAutoMovieAttachment,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  prepared?: prepareSkeletonPoseResolution.IBoneDemand,
  resolution?: ReturnType<typeof preparePoseResolution>,
): IAutoMovieTransform => {
  const seat: IAutoMovieResolvedBone | undefined = (prepared === undefined ? resolvePose(
    parentPose,
    parentSkeleton,
    jointAxes,
    restFrames,
    undefined,
    resolution,
  ) : prepared.resolve(parentPose, resolution)).find(
    (bone: IAutoMovieResolvedBone): boolean =>
      bone.bone === attachment.parentBone,
  );
  if (seat === undefined)
    throw new Error(
      `resolveAttachment: parent bone "${attachment.parentBone}" is not in the skeleton`,
    );

  const offset: IAutoMovieTransform = attachment.offset;
  return {
    translation: Vector3.add(
      seat.worldPosition,
      Quaternion.rotateVector(seat.worldRotation, offset.translation),
    ),
    rotation: Quaternion.multiply(seat.worldRotation, offset.rotation),
    scale: { ...offset.scale },
  };
};
