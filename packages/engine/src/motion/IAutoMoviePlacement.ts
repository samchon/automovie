import { IAutoMovieMotion } from "@automovie/interface";

/**
 * A motion clip placed at a start time on an actor's shot timeline.
 *
 * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-event-composition Places one action source on the actor timeline without losing its authored state.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Supplies the interval and clip that the ordered composition evaluates.
 * @author Samchon
 */
export interface IAutoMoviePlacement {
  /**
   * Seconds into the shot this clip begins.
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-event-composition Locates the action's state contribution on the shot clock.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Fixes the placement boundary used by ordered composition.
   */
  start: number;
  /**
   * The clip (its own local time starts at 0).
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-event-composition Preserves the authored action source and its terminal state during placement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Identifies the clip composed at this ordered layer position.
   */
  motion: IAutoMovieMotion;
}
