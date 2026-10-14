import type { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * Secondary-motion config: the joints that should lag/overshoot the animated
 * target (a tail, ears) and the spring that drives them.
 *
 * @evidence contracts/common.md#principled-implementation Identifies semantic humanoid joints and passes stiffness/damping directly to engine dampedSpring, allowing secondary follow-through without inventing viewer-specific joint axes.
 * @evidence contracts/common.md#clear-and-simple-design One solver-parameter pair applies to the explicitly listed joints; the player owns per-axis values and timestamps separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Joints are selected by the closed humanoid bone union rather than model-specific names, and solver parameters are not silently retuned for particular clips.
 * @evidence contracts/common.md#meaningful-documentation Documents lag/overshoot intent, joint selection and verbatim engine solver parameter forwarding.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The configuration performs no spring integration or joint traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Parameters are inputs and establish no completed-work cache or shared effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The config retains a joint list and scalar parameters only; player state and lifecycle remain with AutoMoviePlayer.
 *
 * @author Samchon
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
