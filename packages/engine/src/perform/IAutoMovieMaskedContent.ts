import {
  AutoMovieBodyRegion,
  AutoMovieHumanoidBone,
} from "@automovie/interface";

/**
 * One action/actor's authored channels removed by its selected body-region mask. Bones are unique in code-unit order; root and expression flags aggregate loss across all keyframes. A record exists only if any channel was removed.
 *
 * @evidence contracts/development/design.md#principled-representation compilePerformance records losses while filtering the same keyframes it assembles, so the diagnostic describes actual discarded content rather than a second approximation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Action index, actor, region and channel-specific losses let performShot locate a failure without duplicating the source clip.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The report does not assert that a masked clip is otherwise valid, and it never compensates for discarded content by synthesizing replacement motion.
 * @evidence contracts/development/common.md#meaningful-documentation Members explain original action indices, deterministic bone ordering and aggregate Boolean loss meaning.
 */
export interface IAutoMovieMaskedContent {
  /** Index into the action list {@link compilePerformance} was given. */
  action: number;

  /** The actor whose clip lost the content (an action may fan to several). */
  actor: string;

  /** The region whose bone set masked it: the action's own, or its default. */
  region: AutoMovieBodyRegion;

  /**
   * The bones the region excludes, sorted by {@link compareCodeUnits} and
   * deduplicated across keyframes. Empty when only the root or the expression
   * was dropped.
   */
  bones: AutoMovieHumanoidBone[];

  /**
   * Whether a keyframe's root displacement was dropped, which happens when a
   * non-locomotion region layers beside another (only the root-bearing region
   * strides).
   */
  root: boolean;

  /** Whether a keyframe's expression was dropped (every region but `face`). */
  expression: boolean;
}
