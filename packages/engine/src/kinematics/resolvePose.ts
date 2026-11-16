import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { IAutoMovieSkeletonTopology } from "./IAutoMovieSkeletonTopology";
import { SKELETON_ROOT_PARENT } from "./constants/SKELETON_ROOT_PARENT";
import { indexSkeletonTopology } from "./indexSkeletonTopology";
import { jointToQuaternion } from "./jointToQuaternion";
import type { preparePoseResolution } from "./preparePoseResolution";
import { resolvePoseBone } from "./resolvePoseBone";
import { skeletonJointAxes } from "./skeletonJointAxes";

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
 * @param jointAxes Per-bone clinical axes, such as `HUMANOID_JOINT_AXES`, for
 *   the bones that declare none of their own ({@link skeletonJointAxes}); a
 *   bone in neither uses the default basis.
 * @param restFrames Per-bone rest frames that read the joint angles as
 *   clinical, such as `HUMANOID_REST_FRAME`; an absent bone reads its angles
 *   as rest-relative.
 * @param topology Index of the same, unchanged skeleton from
 *   {@link indexSkeletonTopology}, reused across poses; omitted, one is built
 *   for this call.
 * @param prepared Optional operation-owned exact FK dependency reader; it shares completed computation while preserving every ordered admission and fresh returned transform.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Standard forward kinematics over a rooted tree, composing quaternion rotations and rotating each rest offset by the parent's world rotation; a parent-first depth-first walk guarantees the parent frame exists when a child is reached, and it premises unit rotations, no rest scale, and a topology built from this unchanged skeleton.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Joint conversion, axis precedence and single-bone composition have the jointToQuaternion, skeletonJointAxes and resolvePoseBone owners. An optional preparePoseResolution reader shares those same computations; this function alone owns admission order and the parent-first walk.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unreachable bones are omitted by the stated contract instead of being attached to a root or thrown on, and no bone or rig is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation States the composition for rotation and position, the axes precedence, that rest scale is ignored, the root default, the output order, which bones are omitted and how to gate on them, how stray and repeated joints are read, and each optional parameter's default.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear ordered joint and reachable-bone scans remain. Ordinary calls convert every joint and compose every bone; a supplied operation reader compares constant-size actual dependency tuples, avoiding only already completed identical math while keeping fresh output allocation. Topology construction when omitted adds linear work; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Caller topology belongs to the same current skeleton. An optional synchronous-operation reader reuses successful joint conversion and bone computation only under exact scalar dependencies, with fresh nested output objects; authored records, missing identities and changed descendants still follow the original recurrence.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local articulation map and result array end with the call. Returned bone transforms are fresh and caller-owned; any supplied reader owns its bounded joint/bone snapshots until its operation releases it, without a global collection or handle.
 */
export const resolvePose: (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
  jointAxes?:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined,
  restFrames?:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
    | undefined,
  topology?: IAutoMovieSkeletonTopology,
  prepared?: ReturnType<typeof preparePoseResolution>,
) => IAutoMovieResolvedBone[] = (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
  prepared?: ReturnType<typeof preparePoseResolution>,
): IAutoMovieResolvedBone[] => {
  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(skeleton, jointAxes);
  const articulation: Map<AutoMovieHumanoidBone, IAutoMovieQuaternion> =
    new Map();
  for (const j of pose.joints)
    articulation.set(
      j.bone,
      prepared === undefined
        ? jointToQuaternion(j, axes[j.bone], restFrames?.[j.bone])
        : prepared.joint(j, axes[j.bone], restFrames?.[j.bone]),
    );

  const resolved: IAutoMovieResolvedBone[] = [];

  // The walk receives the bone object directly (the children map already holds
  // it), so there is no name→bone lookup during the descent.
  const walk: (
    bone: IAutoMovieBone,
    parentWorldRot: IAutoMovieQuaternion,
    parentWorldPos: IAutoMovieVector3,
  ) => void = (
    bone: IAutoMovieBone,
    parentWorldRot: IAutoMovieQuaternion,
    parentWorldPos: IAutoMovieVector3,
  ): void => {
    const art: IAutoMovieQuaternion =
      articulation.get(bone.bone) ?? Quaternion.identity();
    const reading: IAutoMovieResolvedBone =
      prepared === undefined
        ? resolvePoseBone(bone, parentWorldRot, parentWorldPos, art)
        : prepared.bone(bone, parentWorldRot, parentWorldPos, art);
    resolved.push(reading);

    for (const child of topology.childrenByParent.get(bone.bone) ?? [])
      walk(child, reading.worldRotation, reading.worldPosition);
  };

  const rootTranslation: IAutoMovieVector3 =
    pose.root?.translation ?? Vector3.create(0, 0, 0);
  const rootRotation: IAutoMovieQuaternion =
    pose.root?.rotation ?? Quaternion.identity();
  for (const root of topology.childrenByParent.get(SKELETON_ROOT_PARENT) ?? [])
    walk(root, rootRotation, rootTranslation);

  return resolved;
};
