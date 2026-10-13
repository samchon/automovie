import {
  AutoMovieBodyRegion,
  AutoMovieHumanoidBone,
} from "@automovie/interface";

/**
 * What one action's clip lost to its region mask, for the caller that must
 * report it (#1349). The mask is correct and deliberate, but it used to be
 * SILENT: a quadruped gait driving the front legs (the arm chains) under an
 * explicitly lower-body quadruped gait can lose its front-leg arm chains and
 * still come back successful with zero violations. The builder holds both
 * facts (what the synthesizer authored, what the region admits) at the moment
 * it drops one, so it is the only place that can state the difference.
 *
 * Emitted only when something was actually dropped; a clip entirely inside its
 * region produces no record at all.
 *
 * @author Samchon
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
