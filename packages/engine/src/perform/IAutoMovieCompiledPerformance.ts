import { IAutoMovieMotion } from "@automovie/interface";
import { IAutoMovieMaskedContent } from "./IAutoMovieMaskedContent";

/**
 * What {@link compilePerformance} produced: the per-actor clips, and the
 * authored content its region masks discarded.
 *
 * @evidence requirements/actors/performance-and-story-binding.md#actor-performance-local-clock Carries the resolved per-actor motions on their shot-local performance clock.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state Defines the public receipt for a compiled actor performance.
 * @author Samchon
 */
export interface IAutoMovieCompiledPerformance {
  /**
   * Per-actor performance motion, keyed by actor node id.
   *
   * @evidence requirements/actors/performance-and-story-binding.md#actor-performance-local-clock Binds every compiled actor motion to its resolved shot-local timeline.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state Emits the per-actor resolved performance state.
   */
  performances: Record<string, IAutoMovieMotion>;

  /**
   * Every piece of authored content a region mask dropped, ordered by action
   * index then actor. Empty when every clip fell inside its own region, which
   * is the ordinary case.
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-mask-weight Preserves every non-empty mask loss beside the compiled performance.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Makes layer-composition omissions part of the public result rather than a silent drop.
   */
  masked: IAutoMovieMaskedContent[];
}
