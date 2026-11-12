import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Secondary-motion config: the joints that should lag/overshoot the animated
 * target (a tail, ears) and the spring that drives them.
 *
 * @evidence contracts/development/design.md#principled-representation Identifies semantic humanoid joints and passes stiffness/damping directly to engine dampedSpring, allowing secondary follow-through without inventing viewer-specific joint axes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One solver-parameter pair applies to the explicitly listed joints; the player owns per-axis values and timestamps separately.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Joints are selected by the closed humanoid bone union rather than model-specific names, and solver parameters are not silently retuned for particular clips.
 * @evidence contracts/development/common.md#meaningful-documentation Documents lag/overshoot intent, joint selection and verbatim engine solver parameter forwarding.
 */
export interface IAutoMovieSpringConfig {
  /**
   * Humanoid slots whose sampled pose axes use this player's secondary springs.
   */
  joints: AutoMovieHumanoidBone[];

  /**
   * Stiffness parameter passed verbatim to the engine's dampedSpring solver.
   */
  stiffness: number;

  /** Damping parameter passed with the same stiffness to that solver. */
  damping: number;
}
