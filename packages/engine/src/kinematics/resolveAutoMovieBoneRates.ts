import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieResolvedBone,
  IAutoMovieSkeletonTopology,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { SKELETON_ROOT_PARENT } from "./constants/SKELETON_ROOT_PARENT";

/**
 * Propagate declared instantaneous local rotation rates through native FK.
 *
 * Every input bone must come from the same current resolvePose snapshot and
 * unchanged unit-rotation rig as topology, including the ancestors of every
 * demanded bone. Root placement must likewise have a unit rotation.
 * Local angular rates are radians per second in the moving bone's frame:
 * localRotation^-1 times its derivative has vector part omega/2. Root rates
 * are in the resolved bones' common frame, with linear velocity at position.
 * A missing local rate is unknown, including on an unlisted pose joint; a
 * producer that proves rest articulation constant supplies an explicit zero.
 *
 * Native FK applies no root/rest scale and holds each rest translation and
 * rest rotation fixed. This entry differentiates precisely that convention.
 * Changing rest transforms, changing axes/rest frames, or an independently
 * scaled/transformed bone snapshot needs a different derivative producer.
 * Missing ancestors/rates and non-finite inputs return undefined so the owner
 * can retain its generic sampled path. Inputs are read without modification;
 * the successful map and every velocity record are fresh and caller-owned.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States native-FK provenance, unchanged-rig and complete-ancestor requirements, local body-frame radian rates, common-frame metre velocities, explicit-zero versus missing semantics, scale/offset limits, fallback and fresh ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Differentiates p_child=p_parent+R_parent*r_fixed and R_child=R_parent*R_local: v_child=v_parent+omega_parent cross (p_child-p_parent), omega_child=omega_parent+R_child*omega_local_body. Actual resolved positions/rotations provide the same frames as native FK, whose fixed rests and ignored scales are explicit premises.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One parent-first traversal uses the existing topology and resolved records; the local derivative producer and centroidal reducer retain their own responsibilities. Finite admission and completeness gate the entire returned map.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No missing local rate becomes zero, no finite difference or guessed clinical derivative is synthesized, and no bone, fixture, tolerance, scaling rule or root default is substituted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits each supplied ancestor-complete bone once and checks its children and root siblings in the existing topology, skipping absent subtrees. Work is O(T) for T rig bones in the worst case, fresh map/vector storage is O(B) for B supplied bones, and call stack is O(D) for hierarchy depth; no FK pose is recomputed.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pure instantaneous propagation coordinates no repeated requests and retains no cross-call state; its supplied topology belongs to the caller's unchanged rig epoch.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The call owns one O(B) result map and O(D) traversal stack. On unavailable data the temporary result is discarded; on success ownership transfers to the caller. No input, output, handle, task or history is retained.
 */
export function resolveAutoMovieBoneRates(
  topology: IAutoMovieSkeletonTopology,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  localBodyAngularRates: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
  root: resolveAutoMovieBoneRates.IRoot,
): Map<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate> | undefined {
  if (!finite(root.position) || !finite(root.linear) || !finite(root.angular))
    return undefined;

  const resolved: Map<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate> = new Map();
  const walk: (
    definition: IAutoMovieBone,
    parentPosition: IAutoMovieVector3,
    parentRate: resolveAutoMovieBoneRates.IRate,
  ) => boolean = (
    definition: IAutoMovieBone,
    parentPosition: IAutoMovieVector3,
    parentRate: resolveAutoMovieBoneRates.IRate,
  ): boolean => {
    const bone: IAutoMovieResolvedBone | undefined = bones.get(definition.bone);
    if (bone === undefined) return true;

    const local: IAutoMovieVector3 | undefined = localBodyAngularRates.get(definition.bone);
    if (local === undefined || !finite(local) || !finite(bone.worldPosition) ||
        !finite(bone.worldRotation) || !Number.isFinite(bone.worldRotation.w) ||
        bone.bone !== definition.bone)
      return false;

    // A fixed offset moves with the parent only. The child's own rotation
    // affects its attached mass points later, not its joint origin here.
    const offset: IAutoMovieVector3 = Vector3.subtract(bone.worldPosition, parentPosition);
    const linear: IAutoMovieVector3 = Vector3.add(
      parentRate.linear,
      Vector3.cross(parentRate.angular, offset),
    );

    // Right-trivialized local rates live in the moving child frame, so the
    // complete child world rotation carries them into the common frame.
    const angular: IAutoMovieVector3 = Vector3.add(
      parentRate.angular,
      Quaternion.rotateVector(bone.worldRotation, local),
    );
    if (!finite(linear) || !finite(angular)) return false;

    const rate: resolveAutoMovieBoneRates.IRate = { linear, angular };
    resolved.set(definition.bone, rate);
    for (const child of topology.childrenByParent.get(definition.bone) ?? [])
      if (!walk(child, bone.worldPosition, rate)) return false;
    return true;
  };

  for (const definition of topology.childrenByParent.get(SKELETON_ROOT_PARENT) ?? [])
    if (!walk(definition, root.position, root)) return undefined;

  // A supplied descendant below a missing ancestor or a detached subtree was
  // never visited and cannot receive an inferred parent rate.
  return resolved.size === bones.size ? resolved : undefined;
}

/**
 * Rate records exchanged by native derivative producers and mass reduction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Members state common-frame bone-origin linear metres per second, angular radians per second, and the root reference point in metres. Missing declarations are handled by the owning function rather than optional scalar members.
 * @evidence contracts/development/design.md#principled-representation IRate contains a complete instantaneous rigid-frame velocity; IRoot supplies the point where that frame's linear velocity is defined. Inputs and outputs share one common frame, while local body-frame angular inputs remain separately typed vector maps and documented at the function boundary. Runtime finite admission rejects non-finite rates and positions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The FK derivative owns these two records. Native curve producers supply root rates and the centroidal consumer reads world bone-origin rates; imported vector and existing resolved-bone/topology types retain their original owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Complete required vectors avoid partially declared rates. No optional rate is interpreted as zero, no actor/scene data enters the shape, and unchanged native-rig provenance remains an explicit caller premise rather than an unproved type claim.
 */
export namespace resolveAutoMovieBoneRates {
  /**
   * One rigid frame's velocity in the resolved bones' common coordinate frame.
   * Angular and linear rates are simultaneous, with explicit zero vectors for
   * a producer-proven fixed frame. Finite admission belongs to propagation.
   */
  export interface IRate {
    /** Velocity at the bone origin, common-frame metres per second. */
    linear: IAutoMovieVector3;

    /** World angular velocity, common-frame radians per second. */
    angular: IAutoMovieVector3;
  }

  /**
   * The FK root placement's instantaneous common-frame motion. Position is
   * the actual pose.root translation, or the common origin for null placement;
   * the derivative producer must independently prove its supplied rates.
   */
  export interface IRoot extends IRate {
    /** Reference point for linear velocity, common-frame metres. */
    position: IAutoMovieVector3;
  }
}

/** Admit finite coordinates without normalizing, repairing or clamping them. */
function finite(value: IAutoMovieVector3): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}
