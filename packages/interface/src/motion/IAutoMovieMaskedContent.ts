import type { AutoMovieBodyRegion } from "../skeleton/AutoMovieBodyRegion";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One action/actor's authored channels removed by its selected body-region
 * mask. Bones are unique in code-unit order; root and expression flags
 * aggregate loss across all keyframes. A record exists only if any channel was
 * removed.
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
