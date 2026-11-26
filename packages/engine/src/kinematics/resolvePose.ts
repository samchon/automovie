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
import { jointToQuaternion } from "./internal/jointToQuaternion";
import { preparePoseResolution } from "./preparePoseResolution";
import { resolvePoseBone } from "./resolvePoseBone";
import { skeletonJointAxes } from "./internal/skeletonJointAxes";

/**
 * Only the direct pure FK path borrows these defaults; no callback or output
 * receives them.
 */
const IDENTITY: IAutoMovieQuaternion = Quaternion.identity();

/** Model-frame origin for the same direct pure path. */
const ORIGIN: IAutoMovieVector3 = Vector3.create(0, 0, 0);

/**
 * Forward kinematics: resolve a pose against its skeleton into one transform
 * per bone.
 *
 * Each bone's local rotation is its rest rotation composed with the pose's
 * articulation ({@link jointToQuaternion}); its world rotation is the parent's
 * world rotation times that, and its world position is the parent's position
 * plus the rest translation turned by the parent's world rotation. Rest scale
 * is not applied. The walk starts at the pose's `root` transform, or the origin
 * with identity rotation when it is `null`, and visits parents before children,
 * so the result lists bones in that order. The renderer uses `localRotation`;
 * validators and solvers use the world fields.
 *
 * Only bones reachable from a null-parent root are resolved. A bone with an
 * undeclared parent, in a detached subtree or in a parent cycle is omitted, and
 * a skeleton without a root resolves to an empty array; callers that need a
 * bone gate on {@link reachableBoneNames}, which reports the same set. A joint
 * for an undeclared or unreachable bone contributes no transform, but every
 * authored record is still admitted in order; a repeated bone takes the later
 * joint. An optional requested set returns only its reachable bones and
 * computes their ancestors, pruning unrelated subtrees after admission.
 *
 * @param pose Joint angles and root transform to resolve.
 * @param skeleton Rig the pose articulates.
 * @param jointAxes Per-bone clinical axes, such as `HUMANOID_JOINT_AXES`, for
 *   the bones that declare none of their own ({@link skeletonJointAxes}); a bone
 *   in neither uses the default basis.
 * @param restFrames Per-bone rest frames that read the joint angles as
 *   clinical, such as `HUMANOID_REST_FRAME`; an absent bone reads its angles as
 *   rest-relative.
 * @param topology Index of the same, unchanged skeleton from
 *   {@link indexSkeletonTopology}, reused across poses; omitted, one is built
 *   for this call.
 * @param prepared Optional operation-owned raw FK adapter; it shares pure
 *   exact-angle factors while preserving every current input read and fresh
 *   returned transform.
 * @param requested Optional output bone set; omitted, resolve every reachable
 *   bone. Ancestors are computed internally and need not be requested.
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
  topology?: IAutoMovieSkeletonTopology,
  prepared?: ReturnType<typeof preparePoseResolution>,
  requested?: ReadonlySet<string>,
): IAutoMovieResolvedBone[] => {
  const childrenByParent: IAutoMovieSkeletonTopology["childrenByParent"] =
    topology?.childrenByParent ?? indexSkeletonTopology.children(skeleton);
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
      childrenByParent.get(bone.bone);
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
    childrenByParent.get(SKELETON_ROOT_PARENT);
  if (roots !== undefined && roots !== null)
    for (const root of roots) walk(root, rootRotation, rootTranslation);

  return resolved;
};

/**
 * Include each demanded bone's parents so ordinary FK can prune unrelated
 * subtrees.
 */
function ancestorClosure(
  skeleton: IAutoMovieSkeleton,
  requested: ReadonlySet<string>,
): ReadonlySet<string> {
  const parents: Map<string, AutoMovieHumanoidBone | null> = new Map();
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
