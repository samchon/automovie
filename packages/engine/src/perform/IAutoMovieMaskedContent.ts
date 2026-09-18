import { AutoMovieBodyRegion, AutoMovieHumanoidBone } from "@automovie/interface";

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
 * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-mask-weight Records exactly which authored channels an explicit region mask removed.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Carries the loss receipt required when mask composition discards content.
 * @author Samchon
 */
export interface IAutoMovieMaskedContent {
  /**
   * Index into the action list {@link compilePerformance} was given.
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-mask-weight Identifies the authored action whose mask caused this loss.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Keeps each mask-loss receipt tied to its composition input.
   */
  action: number;

  /**
   * The actor whose clip lost the content (an action may fan to several).
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-mask-weight Names the actor whose layer mask removed authored channels.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Preserves actor ownership on the composition-loss record.
   */
  actor: string;

  /**
   * The region whose bone set masked it: the action's own, or its default.
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-mask-weight Reports the precise named mask responsible for the loss.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Carries the resolved region-mask identity through composition diagnostics.
   */
  region: AutoMovieBodyRegion;

  /**
   * The bones the region excludes, sorted by {@link compareCodeUnits} and
   * deduplicated across keyframes. Empty when only the root or the expression
   * was dropped.
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Enumerates the bone channels that fell outside the selected layer owner.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Makes bone-channel loss observable after mask composition.
   */
  bones: AutoMovieHumanoidBone[];

  /**
   * Whether a keyframe's root displacement was dropped, which happens when a
   * non-locomotion region layers beside another (only the root-bearing region
   * strides).
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Reports when root authority caused a non-owning layer's displacement to be removed.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Exposes the root-channel consequence of composition ownership.
   */
  root: boolean;

  /**
   * Whether a keyframe's expression was dropped (every region but `face`).
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Reports when the face owner excludes an expression from another region.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Exposes expression-channel loss caused by disjoint layer ownership.
   */
  expression: boolean;
}
