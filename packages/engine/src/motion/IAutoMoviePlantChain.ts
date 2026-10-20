import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * A two-segment chain pinned by its end effector: a leg (hip → knee → ankle) or
 * an arm (shoulder → elbow → hand). The plant solver is limb-agnostic: which
 * bones form the chain is the caller's rig policy, the algebra is not.
 *
 * @evidence contracts/common.md#principled-implementation Semantic upper, lower and effector slots identify the two-segment kinematic chain whose geometry is resolved from one supplied skeleton, avoiding stale copied segment lengths.
 * @evidence contracts/common.md#clear-and-simple-design A limb-independent descriptor lets foot stance and declared hand contact share fitChainToTarget while each caller owns its contact policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither an asset's topology names nor a measured target selects the chain; the caller explicitly provides all three anatomical slots.
 * @evidence contracts/common.md#meaningful-documentation Explains segment order, foot and hand use, and the separation between caller rig policy and common limb algebra.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This identity record contains no geometric solve or skeleton indexing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A named chain may be reused as input, but resolved geometry equivalence is owned by the prepared-chain operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three bone-slot values hold no target history, cached matrices or solver workspace.
 */
export interface IAutoMoviePlantChain {
  /** End-effector bone driven onto the pinned target (foot / hand). */
  effector: AutoMovieHumanoidBone;

  /** Chain-root segment (thigh / upper arm). */
  upper: AutoMovieHumanoidBone;

  /** Mid segment (shin / forearm). */
  lower: AutoMovieHumanoidBone;
}
