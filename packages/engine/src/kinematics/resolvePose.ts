import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { SKELETON_ROOT_PARENT } from "./constants/SKELETON_ROOT_PARENT";
import { indexSkeletonTopology } from "./indexSkeletonTopology";
import { jointToQuaternion } from "./jointToQuaternion";

/**
 * Forward kinematics: resolve a pose against its skeleton into one transform
 * per bone.
 *
 * Each bone's local rotation is its rest rotation composed with the pose's
 * articulation ({@link jointToQuaternion}); its world rotation is the parent's
 * world rotation times that, and its world position is the parent's position
 * plus the rest translation turned by the parent's world rotation. Rest scale
 * is not applied. The walk starts at the pose's `root` transform, or the
 * origin with identity rotation when it is `null`, and visits parents before
 * children, so the result lists bones in that order. The renderer uses
 * `localRotation`; validators and solvers use the world fields.
 *
 * Only bones reachable from a null-parent root are resolved. A bone with an
 * undeclared parent, in a detached subtree or in a parent cycle is omitted,
 * and a skeleton without a root resolves to an empty array; callers that need
 * a bone gate on {@link reachableBoneNames}, which reports the same set. A
 * joint for an undeclared or unreachable bone is ignored, and a bone named by
 * two joints takes the later one.
 *
 * @param pose Joint angles and root transform to resolve.
 * @param skeleton Rig the pose articulates.
 * @param jointAxes Per-bone clinical axes, such as `HUMANOID_JOINT_AXES`; an
 *   absent bone uses the default basis.
 * @param restFrames Per-bone rest frames that read the joint angles as
 *   clinical, such as `HUMANOID_REST_FRAME`; an absent bone reads its angles
 *   as rest-relative.
 * @param topology Index of the same, unchanged skeleton from
 *   {@link indexSkeletonTopology}, reused across poses; omitted, one is built
 *   for this call.
 *
 * @evidence contracts/common.md#principled-implementation Standard forward kinematics over a rooted tree, composing quaternion rotations and rotating each rest offset by the parent's world rotation; a parent-first depth-first walk guarantees the parent frame exists when a child is reached, and it premises unit rotations, no rest scale, and a topology built from this unchanged skeleton.
 * @evidence contracts/common.md#clear-and-simple-design Articulation is delegated to `jointToQuaternion` and the hierarchy to the shared topology index, so this function only composes; the root sentinel is the shared `SKELETON_ROOT_PARENT`, and the walk receives bone objects so no name lookup happens during descent.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreachable bones are omitted by the stated contract instead of being attached to a root or thrown on, and no bone or rig is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the composition for rotation and position, that rest scale is ignored, the root default, the output order, which bones are omitted and how to gate on them, how stray and repeated joints are read, and each optional parameter's default.
 * @evidence contracts/performance.md#efficient-algorithms Linear in joints plus reachable bones: one articulation per joint, then one composition per bone; building the topology when none is passed is also linear in the bone count.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses a caller-supplied topology across poses of one skeleton instead of rebuilding it; equivalence is the unchanged skeleton object, which the caller owns, and omitting the topology always rebuilds.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the articulation map is local to the call and the returned bones, one per reachable bone, are owned by the caller.
 * @author Samchon
 */
export const resolvePose = (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
): IAutoMovieResolvedBone[] => {
  const articulation: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion> =
    new Map();
  for (const j of pose.joints)
    articulation.set(
      j.bone,
      jointToQuaternion(j, jointAxes?.[j.bone], restFrames?.[j.bone]),
    );

  const resolved: IAutoMovieResolvedBone[] = [];

  // The walk receives the bone object directly (the children map already holds
  // it), so there is no name→bone lookup during the descent.
  const walk = (
    bone: IAutoMovieBone,
    parentWorldRot: IAutoMovieQuaternion,
    parentWorldPos: IAutoMovieVector3,
  ): void => {
    const art: IAutoMovieQuaternion =
      articulation.get(bone.bone) ?? Quaternion.identity();
    const localRotation: IAutoMovieQuaternion = Quaternion.multiply(
      bone.rest.rotation,
      art,
    );

    const worldRot: IAutoMovieQuaternion = Quaternion.multiply(
      parentWorldRot,
      localRotation,
    );
    const worldPos: IAutoMovieVector3 = Vector3.add(
      parentWorldPos,
      Quaternion.rotateVector(parentWorldRot, bone.rest.translation),
    );

    resolved.push({
      bone: bone.bone,
      localRotation,
      worldPosition: worldPos,
      worldRotation: worldRot,
    });

    for (const child of topology.childrenByParent.get(bone.bone) ?? [])
      walk(child, worldRot, worldPos);
  };

  const rootTranslation: IAutoMovieVector3 =
    pose.root?.translation ?? Vector3.create(0, 0, 0);
  const rootRotation: IAutoMovieQuaternion =
    pose.root?.rotation ?? Quaternion.identity();
  for (const root of topology.childrenByParent.get(SKELETON_ROOT_PARENT) ?? [])
    walk(root, rootRotation, rootTranslation);

  return resolved;
};
