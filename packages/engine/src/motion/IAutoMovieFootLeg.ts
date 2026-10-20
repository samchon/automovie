import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * The leg chain that plants one foot: the foot end-effector and its upper/lower
 * segments from hip to knee and knee to ankle. Bone slots must resolve on the
 * supplied skeleton; plantStanceFeet's defaults come from HUMANOID_LEG_CHAINS.
 *
 * @evidence contracts/common.md#principled-implementation Identifies the two articulated segments and their foot effector by semantic bone slots, the data needed to resolve and plant a leg without storing duplicated rest lengths.
 * @evidence contracts/common.md#clear-and-simple-design The foot-named record adapts HUMANOID_LEG_CHAINS to stance detection, while fitChainToTarget consumes the corresponding generic effector chain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callers may supply any resolving leg slots; the default humanoid choice is explicit in plantStanceFeet rather than inferred from mesh or asset names.
 * @evidence contracts/common.md#meaningful-documentation Identifies hip-knee-ankle roles, resolution requirements and the shared source of default legs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Three semantic bone fields perform no chain traversal or inverse-kinematics computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Bone identities describe a leg but cache neither resolved transforms nor fitted articulations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The leg descriptor retains only three bone strings; FK samples and stance targets belong to the planting operation.
 */
export interface IAutoMovieFootLeg {
  /** Foot end-effector bone (the ground-contact point that is pinned). */
  foot: AutoMovieHumanoidBone;

  /** Upper leg segment (thigh): the chain root. */
  upper: AutoMovieHumanoidBone;

  /** Lower leg segment (shin). */
  lower: AutoMovieHumanoidBone;
}
