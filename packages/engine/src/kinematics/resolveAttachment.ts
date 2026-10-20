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
 *
 * @evidence contracts/common.md#principled-implementation Rigid composition of the bone's resolved world frame with the offset transform, the fixed-joint relation; it premises unit-length rotations and treats the bone frame as unscaled, since a resolved bone carries no scale, so the offset's scale passes through unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Reuses resolvePose for forward kinematics instead of a private chain walk, so the child rides the same posed bones as the renderer; compileAttach samples this bone-to-child composition per frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unresolvable bone throws instead of falling back to the root or skipping the frame, and no rig or bone is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the output frame, the three composition rules, when it throws and why, the requirement that axes and rest frames match the renderer, and each parameter's role.
 * @evidence contracts/performance.md#efficient-algorithms One forward-kinematics pass over the parent skeleton, linear in its bone count, then a linear search for the bone and constant composition; the full pass is needed because the bone's frame depends on every ancestor.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one pose that coordinates no work across calls; each sampled frame resolves a different pose.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the resolved bones are local to the call and the returned transform, including its copied scale, is owned by the caller.
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
) => IAutoMovieTransform = (
  parentPose: IAutoMoviePose,
  parentSkeleton: IAutoMovieSkeleton,
  attachment: IAutoMovieAttachment,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
): IAutoMovieTransform => {
  const seat: IAutoMovieResolvedBone | undefined = resolvePose(
    parentPose,
    parentSkeleton,
    jointAxes,
    restFrames,
  ).find(
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
