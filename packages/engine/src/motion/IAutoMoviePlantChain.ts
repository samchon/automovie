import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * A two-segment chain pinned by its end effector: a leg (hip → knee → ankle) or
 * an arm (shoulder → elbow → hand). The plant solver is limb-agnostic: which
 * bones form the chain is the caller's rig policy, the algebra is not.
 *
 * @evidence contracts/development/design.md#principled-representation Semantic upper, lower and effector slots identify the two-segment kinematic chain whose geometry is resolved from one supplied skeleton, avoiding stale copied segment lengths.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A limb-independent descriptor lets foot stance and declared hand contact share fitChainToTarget while each caller owns its contact policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither an asset's topology names nor a measured target selects the chain; the caller explicitly provides all three anatomical slots.
 * @evidence contracts/development/common.md#meaningful-documentation Explains segment order, foot and hand use, and the separation between caller rig policy and common limb algebra.
 */
export interface IAutoMoviePlantChain {
  /** End-effector bone driven onto the pinned target (foot / hand). */
  effector: AutoMovieHumanoidBone;

  /** Chain-root segment (thigh / upper arm). */
  upper: AutoMovieHumanoidBone;

  /** Mid segment (shin / forearm). */
  lower: AutoMovieHumanoidBone;
}
