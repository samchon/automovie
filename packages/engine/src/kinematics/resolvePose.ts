import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { SKELETON_ROOT_PARENT } from "./constants/SKELETON_ROOT_PARENT";
import { indexSkeletonTopology } from "./indexSkeletonTopology";
import { jointToQuaternion } from "./jointToQuaternion";
import { preparePoseResolution } from "./preparePoseResolution";
import { resolvePoseBone } from "./resolvePoseBone";
import { skeletonJointAxes } from "./skeletonJointAxes";

/** Only the direct pure FK path borrows these defaults; no callback or output receives them. */
const IDENTITY: IAutoMovieQuaternion = Object.freeze(Quaternion.identity());

/** Model-frame origin for the same direct pure path. */
const ORIGIN: IAutoMovieVector3 = Object.freeze(Vector3.create(0, 0, 0));

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
 * joint for an undeclared or unreachable bone contributes no transform, but
 * every authored record is still admitted in order; a repeated bone takes
 * the later joint. An optional requested set returns only its reachable bones
 * and computes their ancestors, pruning unrelated subtrees after admission.
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
 * @param prepared Optional operation-owned raw FK adapter; it shares pure exact-angle factors while preserving every current input read and fresh returned transform.
 * @param requested Optional output bone set; omitted, resolve every reachable bone. Ancestors are computed internally and need not be requested.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Standard forward kinematics over a rooted tree, composing quaternion rotations and rotating each rest offset by the parent's world rotation; a parent-first depth-first walk guarantees the parent frame exists when a child is reached, and it premises unit rotations, no rest scale, and a topology built from this unchanged skeleton.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Joint conversion, axis precedence and single-bone composition have the jointToQuaternion, skeletonJointAxes and resolvePoseBone owners. An optional preparePoseResolution adapter shares pure joint factors while keeping raw bone composition direct; this function owns admission order and the parent-first walk.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unreachable bones are omitted by the stated contract instead of being attached to a root or thrown on, and no bone or rig is special-cased.
 * @evidence contracts/development/common.md#meaningful-documentation States the composition for rotation and position, the axes precedence, that rest scale is ignored, the root default, the output order, which bones are omitted and how to gate on them, how stray and repeated joints are read, and each optional parameter's default.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every call retains O(J) ordered joint admission and O(B) axes precedence. Omitted demand composes all reachable bones; explicit demand builds an O(B) parent map and visits only the demanded ancestor closure, returning K fresh outputs. A supplied reader shares pure exact-angle joint factors; raw bone arithmetic remains live. Direct pure FK shares immutable identity/origin defaults without per-call allocations; supplied adapters retain their original call-local default operands. Omitted topology adds O(B) construction. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Caller topology belongs to the same current skeleton. A supplied synchronous adapter shares only pure fixed-basis/exact-angle work after original clinical/frame reads; raw transforms retain original read/arithmetic order. Direct pure FK borrows immutable default operands only into input-preserving math; custom adapter calls retain fresh default operands and one missing-articulation identity per call. No raw mutable-input identity certifies a prior bone result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local articulation/demand maps and any adapter-owned call-local default operands end with the call. The direct path's two private immutable constants retain no source/result data, and all returned transforms/nested values remain fresh caller-owned copies. A supplied adapter owns weak admitted-basis factor workspaces until operation release, without retaining raw joints/transforms, history or a handle.
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
  requested?: ReadonlySet<string>,
) => IAutoMovieResolvedBone[] = (
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(skeleton),
  prepared?: ReturnType<typeof preparePoseResolution>,
  requested?: ReadonlySet<string>,
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
  let missingArticulation: IAutoMovieQuaternion | undefined;
  const required: ReadonlySet<string> | undefined =
    requested === undefined ? undefined : ancestorClosure(skeleton, requested);

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
    if (required !== undefined && !required.has(bone.bone)) return;
    let art: IAutoMovieQuaternion | undefined = articulation.get(bone.bone);
    if (art === undefined) {
      missingArticulation ??=
        prepared === undefined ? IDENTITY : Quaternion.identity();
      art = missingArticulation;
    }
    const reading: IAutoMovieResolvedBone =
      prepared === undefined
        ? resolvePoseBone(bone, parentWorldRot, parentWorldPos, art)
        : prepared.bone(bone, parentWorldRot, parentWorldPos, art);
    if (requested === undefined || requested.has(bone.bone))
      resolved.push(reading);

    const children: readonly IAutoMovieBone[] | undefined =
      topology.childrenByParent.get(bone.bone);
    if (children !== undefined && children !== null)
      for (const child of children)
        walk(child, reading.worldRotation, reading.worldPosition);
  };

  const rootTranslation: IAutoMovieVector3 =
    pose.root?.translation ??
    (prepared === undefined ? ORIGIN : Vector3.create(0, 0, 0));
  const rootRotation: IAutoMovieQuaternion =
    pose.root?.rotation ??
    (prepared === undefined ? IDENTITY : Quaternion.identity());
  const roots: readonly IAutoMovieBone[] | undefined =
    topology.childrenByParent.get(SKELETON_ROOT_PARENT);
  if (roots !== undefined && roots !== null)
    for (const root of roots) walk(root, rootRotation, rootTranslation);

  return resolved;
};

/** Include each demanded bone's parents so ordinary FK can prune unrelated subtrees. */
function ancestorClosure(
  skeleton: IAutoMovieSkeleton,
  requested: ReadonlySet<string>,
): ReadonlySet<string> {
  const parents: Map<string, AutoMovieHumanoidBone | null> =
    new Map();
  for (const bone of skeleton.bones) parents.set(bone.bone, bone.parent);
  const required: Set<string> = new Set();
  for (const name of requested) {
    let bone: string | null | undefined = name;
    while (bone !== null && bone !== undefined && !required.has(bone)) {
      required.add(bone);
      bone = parents.get(bone);
    }
  }
  return required;
}
