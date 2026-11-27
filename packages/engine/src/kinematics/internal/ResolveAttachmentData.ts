import type { IAutoMoviePose } from "@automovie/interface";
import type { IAutoMovieSkeleton } from "@automovie/interface";
import type { IAutoMovieAttachment } from "@automovie/interface";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import type { IAutoMovieJointAxes } from "@automovie/interface";
import type { IAutoMovieRestFrame } from "@automovie/interface";
import type { prepareSkeletonPoseResolution } from "./prepareSkeletonPoseResolution";
import type { AutoMovieEngineKinematics } from "../AutoMovieEngineKinematics";
import type { IAutoMovieTransform } from "@automovie/interface";
import type { IAutoMovieResolvedBone } from "@automovie/interface";
import { resolvePose } from "./resolvePose";
import { Vector3 } from "../../math/Vector3";
import { Quaternion } from "../../math/Quaternion";

/*
 * The transform of a child model's root rigidly coupled to one bone of a posed
 * parent skeleton, in the parent skeleton's model space: a rider on a horse, a
 * sword in a hand, a passenger in a cart.
 *
 * The parent pose is resolved by forward kinematics (resolvePose) and
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
 * Parameter parentPose: Pose of the parent skeleton.
 * Parameter parentSkeleton: Rig the pose articulates.
 * Parameter attachment: Bone to ride and the child's offset in that bone's frame.
 * Parameter jointAxes: Per-bone clinical axes for forward kinematics.
 * Parameter restFrames: Per-bone rest frames for reading the pose as clinical.
 * Parameter prepared: Optional genuine fixed demand for this exact parent
 * rig/mappings and attachment bone; omission retains raw full FK.
 * Parameter resolution: Optional exact reader borrowed from the synchronous bake,
 * never retained here.
 */
export const resolveAttachmentRun: (
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
  resolution?: ReturnType<
    typeof AutoMovieEngineKinematics.preparePoseResolution
  >,
) => IAutoMovieTransform = (
  parentPose: IAutoMoviePose,
  parentSkeleton: IAutoMovieSkeleton,
  attachment: IAutoMovieAttachment,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  prepared?: prepareSkeletonPoseResolution.IBoneDemand,
  resolution?: ReturnType<
    typeof AutoMovieEngineKinematics.preparePoseResolution
  >,
): IAutoMovieTransform => {
  const frames: IAutoMovieResolvedBone[] =
    prepared === undefined
      ? resolvePose(
          parentPose,
          parentSkeleton,
          jointAxes,
          restFrames,
          undefined,
          resolution,
        )
      : prepared.resolve(parentPose, resolution);
  let seat: IAutoMovieResolvedBone | undefined;
  const count: number = frames.length;
  for (let index: number = 0; index < count; ++index) {
    const bone: IAutoMovieResolvedBone = frames[index]!;
    if (bone.bone === attachment.parentBone) {
      seat = bone;
      break;
    }
  }
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
