import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieChainBone } from "../kinematics/IAutoMovieChainBone";
import type { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { Quaternion } from "../math/Quaternion";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";

/** Source end articulation and clinical mappings corresponding to completed FK frames. */
type IProps = Pick<
  IFitChainToTargetProps,
  "skeleton" | "pose" | "chain" | "jointAxes" | "restFrames"
>;

/**
 * Recover the fixed mid-to-effector rotation of a supported descendant chain
 * from two already resolved frames. An unsupported chain keeps the legacy
 * effector-own rest rotation, or identity when its bone is missing.
 * The preceding full FK must have admitted all authored records in order;
 * its last effector articulation is removed on the right, retaining every
 * intermediate rest transform and articulation. Topology must belong to the
 * unchanged skeleton, as it does for the preceding full FK.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States prior FK admission, topology validity, supported ancestry and the legacy unsupported-chain fallback.
 * @evidence contracts/development/implementation.md#principled-implementation A reachable strict upper-to-mid-to-end chain admits fixed-frame recovery; fromPrepared owns the exact inverse composition. An unrelated or missing chain retains the former effector-own rest convention.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This entry owns standalone ancestry admission, while fromPrepared owns fixed-frame recovery and isDescendant is the same traversal preparation uses.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No disconnected branch is treated as fixed below the mid bone; the full FK admission happens first, preserving the authored-record error order.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two bounded descendant walks plus fromPrepared's O(J+B) record/bone reads, without an additional FK. Preparation calls fromPrepared after its existing admission, avoiding duplicate tree walks.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the caller's completed lower/end frames and delegates the fixed-frame formula to the same owner preparation uses; it neither repeats FK nor caches by mutable rig identity.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one derived quaternion and retains no pose, frame map, rig, handle or task after return.
 */
export function resolveChainEffectorBaseRotation(
  props: IProps & Pick<IFitChainToTargetProps, "topology">,
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

/**
 * The shared ancestry admission and fixed-frame recovery of chain preparation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes already admitted preparation from standalone full-FK inputs.
 * @evidence contracts/development/design.md#principled-representation A rooted descendant relation admits a fixed relative frame; the raw recovery then operates on already resolved rotations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Preparation shares the original ancestry traversal and bypasses only a check it has just completed; standalone orientation and twist use the checked entry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No mutable-body cache, alternate topology or consumer-specific ancestry test is introduced.
 */
export namespace resolveChainEffectorBaseRotation {
  /**
   * Recover an admitted chain's fixed frame, reusing a completed lower inverse
   * when available. Completed FK must have admitted the same end articulation
   * and unchanged non-chain records. The caller owns remaining upper/mid
   * admission and must have admitted strict upper-to-mid-to-end ancestry.
   *
   * States completed end/non-chain admission, the caller's remaining chain admission, strict ancestry and exact optional-inverse identity.
   * Full FK gives endWorld = lowerWorld * fixedFrame * endArticulation, so left multiplication by lowerWorld inverse and right multiplication by the last end articulation inverse recover the fixed frame.
   * The same recovery serves preparation and the checked standalone entry, with no repeated FK or ancestry scan after preparation's admission.
   * Skeleton-declared axes override the host table and the last actual end articulation is removed; unchanged intermediate transforms remain in the recovered frame.
   * One O(J) last-record scan, at most one O(B) bone lookup and one clinical conversion plus constant quaternion work; preparation reuses its already computed lower inverse.
   * Borrows the caller's completed full-FK frames and exact lower inverse, rather than resolving the same pose again.
   * Returns one derived quaternion and retains no inputs, map, rig, handle or task after return.
   */
  export function fromPrepared(
    props: IProps,
    lower: IAutoMovieChainBone,
    end: IAutoMovieChainBone,
    inverseLower?: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion {
    let joint: IAutoMovieJointPose | undefined;
    for (const candidate of props.pose.joints)
      if (candidate.bone === props.chain.effector) joint = candidate;
    const articulation: IAutoMovieQuaternion =
      joint === undefined
        ? Quaternion.identity()
        : jointToQuaternion(
            joint,
            props.skeleton.bones.find(
              (bone: IAutoMovieBone): boolean =>
                bone.bone === props.chain.effector,
            )?.axes ?? props.jointAxes?.[props.chain.effector],
            props.restFrames?.[props.chain.effector],
          );
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
   * States strict descent, root reachability and unchanged-topology premises.
   * A depth-first walk of the existing parent-to-children index finds a strict descendant without assuming direct adjacency.
   * Preparation and standalone frame recovery use one ancestry owner instead of separate hierarchy policies.
   * Equal identities are not accepted by themselves and unreachable/cyclic inputs are excluded by the callers' root-reachability admission.
   * Visits at most the ancestor's descendant subtree, O(B) time and O(tree depth) stack, stopping at the first match.
   * Reuses the caller's existing topology; prepared callers do not repeat the traversal in fromPrepared.
   * Uses only the recursion stack and retains no index, rig, cache or handles after return.
   */
  export function isDescendant(
    topology: IAutoMovieSkeletonTopology,
    ancestor: AutoMovieHumanoidBone,
    descendant: AutoMovieHumanoidBone,
  ): boolean {
    return (topology.childrenByParent.get(ancestor) ?? []).some(
      (child: IAutoMovieBone): boolean =>
        child.bone === descendant ||
        isDescendant(topology, child.bone, descendant),
    );
  }
}
