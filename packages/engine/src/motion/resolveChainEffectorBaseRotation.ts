import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieChainBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSkeletonTopology,
} from "@automovie/interface";

import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { preparePoseResolution } from "../kinematics/preparePoseResolution";
import type { prepareSkeletonPoseResolution } from "../kinematics/prepareSkeletonPoseResolution";
import { Quaternion } from "../math/Quaternion";

/**
 * Source end articulation and clinical mappings corresponding to completed FK
 * frames.
 */
type IProps = Pick<
  IAutoMovieFitChainToTargetProps,
  "skeleton" | "pose" | "chain" | "jointAxes" | "restFrames"
>;

/**
 * Recover the fixed mid-to-effector rotation of a supported descendant chain
 * from two already resolved frames. An unsupported chain keeps the legacy
 * effector-own rest rotation, or identity when its bone is missing. The
 * preceding FK must have admitted all authored records in order and resolved
 * the actual lower/end frames, even when its outputs were demanded; its last
 * effector articulation is removed on the right, retaining every intermediate
 * rest transform and articulation. Topology must belong to the unchanged
 * skeleton, as it does for the preceding FK.
 */
export function resolveChainEffectorBaseRotation(
  props: IProps & Pick<IAutoMovieFitChainToTargetProps, "topology">,
  lower: IAutoMovieChainBone,
  end: IAutoMovieChainBone,
): IAutoMovieQuaternion {
  if (
    !props.topology.reachableBones.has(props.chain.upper) ||
    !props.topology.reachableBones.has(props.chain.lower) ||
    !props.topology.reachableBones.has(props.chain.effector) ||
    !resolveChainEffectorBaseRotation.isDescendant(
      props.topology,
      props.chain.upper,
      props.chain.lower,
    ) ||
    !resolveChainEffectorBaseRotation.isDescendant(
      props.topology,
      props.chain.lower,
      props.chain.effector,
    )
  )
    return (
      props.skeleton.bones.find(
        (bone: IAutoMovieBone): boolean => bone.bone === props.chain.effector,
      )?.rest.rotation ?? Quaternion.identity()
    );
  return resolveChainEffectorBaseRotation.fromPrepared(props, lower, end);
}

/** The shared ancestry admission and fixed-frame recovery of chain preparation. */
export namespace resolveChainEffectorBaseRotation {
  /**
   * Recover an admitted chain's fixed frame, reusing a completed lower inverse
   * when available. Completed FK must have admitted the same end articulation
   * and unchanged non-chain records. The caller owns remaining upper/mid
   * admission and must have admitted strict upper-to-mid-to-end ancestry. An
   * optional raw operation reader shares pure exact-angle factors while
   * preserving current clinical/frame reads; missing end records still use
   * identity without admitting any clinical basis. An optional genuine
   * poseResolution must own this exact unchanged rig and mappings; it actually
   * admits the last joint through the same convention and operation rows used
   * by preceding prepared FK, returning a fresh value.
   *
   * States completed end/non-chain admission, the caller's remaining chain
   * admission, strict ancestry and exact optional-inverse identity. Full FK
   * gives endWorld = lowerWorld * fixedFrame * endArticulation, so left
   * multiplication by lowerWorld inverse and right multiplication by the last
   * end articulation inverse recover the fixed frame. The same recovery serves
   * preparation and the checked standalone entry, with no repeated FK or
   * ancestry scan after preparation's admission. Skeleton-declared axes
   * override the host table and the last actual end articulation is removed;
   * unchanged intermediate transforms remain in the recovered frame. One O(J)
   * last-record scan, at most one O(B) bone lookup and one actual clinical
   * conversion plus constant quaternion recovery; raw readers share pure
   * factors and a genuine prepared rig may share its actual completed
   * same-valued joint. Preparation reuses its lower inverse without another FK.
   * Runtime speedup is unmeasured. Borrows completed frames/lower inverse. Raw
   * readers retain original current-input admission, while the genuine
   * immutable producer shares exact convention-owned completed conversion after
   * rechecking the actual joint. An absent end still admits no basis. Returns
   * one derived quaternion and retains no inputs, map, rig, handle or task
   * after return.
   */
  export function fromPrepared(
    props: IProps,
    lower: IAutoMovieChainBone,
    end: IAutoMovieChainBone,
    inverseLower?: IAutoMovieQuaternion,
    resolution?: ReturnType<typeof preparePoseResolution>,
    poseResolution?: prepareSkeletonPoseResolution.IRig,
  ): IAutoMovieQuaternion {
    let joint: IAutoMovieJointPose | undefined;
    for (const candidate of props.pose.joints)
      if (candidate.bone === props.chain.effector) joint = candidate;
    let articulation: IAutoMovieQuaternion;
    if (joint === undefined) articulation = Quaternion.identity();
    else if (poseResolution !== undefined)
      articulation = poseResolution.joint(joint, resolution);
    else {
      const axes: IAutoMovieJointAxes | undefined =
        props.skeleton.bones.find(
          (bone: IAutoMovieBone): boolean => bone.bone === props.chain.effector,
        )?.axes ?? props.jointAxes?.[props.chain.effector];
      const frame: IAutoMovieRestFrame | undefined =
        props.restFrames?.[props.chain.effector];
      articulation =
        resolution === undefined
          ? jointToQuaternion(joint, axes, frame)
          : resolution.joint(joint, axes, frame);
    }
    return Quaternion.multiply(
      Quaternion.multiply(
        inverseLower ?? Quaternion.inverse(lower.worldRotation),
        end.worldRotation,
      ),
      Quaternion.inverse(articulation),
    );
  }

  /**
   * Whether one root-reachable bone lies strictly below another in the same
   * unchanged rooted topology; root reachability excludes detached cycles.
   *
   * States strict descent, root reachability and unchanged-topology premises. A
   * depth-first walk of the existing parent-to-children index finds a strict
   * descendant without assuming direct adjacency. Preparation and standalone
   * frame recovery use one ancestry owner instead of separate hierarchy
   * policies. Equal identities are not accepted by themselves and
   * unreachable/cyclic inputs are excluded by the callers' root-reachability
   * admission. Visits at most the ancestor's descendant subtree, O(B) time and
   * O(tree depth) stack, stopping at the first match; direct iteration
   * allocates neither empty fallback arrays nor recursive predicate closures.
   * Reuses the caller's existing topology; prepared callers do not repeat the
   * traversal in fromPrepared. Uses only the recursion stack and retains no
   * index, rig, cache or handles after return.
   */
  export function isDescendant(
    topology: IAutoMovieSkeletonTopology,
    ancestor: AutoMovieHumanoidBone,
    descendant: AutoMovieHumanoidBone,
  ): boolean {
    const children: readonly IAutoMovieBone[] | undefined =
      topology.childrenByParent.get(ancestor);
    if (children === undefined || children === null) return false;

    // Preserve some's entry length and missing-slot behavior without a new
    // predicate closure at every node of the same ordered traversal.
    const count: number = children.length;
    for (let index: number = 0; index < count; ++index) {
      const child: IAutoMovieBone = children[index]!;
      if (
        child.bone === descendant ||
        isDescendant(topology, child.bone, descendant)
      )
        return true;
    }
    return false;
  }
}
