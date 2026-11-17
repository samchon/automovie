import type { IAutoMovieMotionHumanWater } from "../perform/IAutoMovieMotionHumanWater";

/**
 * A supine float or passive head-first glide on a horizontal water plane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the held shape and states the duration, medium and initial speed with their units and defaults.
 * @evidence contracts/development/design.md#principled-representation One medium, span and initial speed describe passive immersion. Zero initial speed is the still case of the same motion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The registered swimImmersed law reads the existing water environment and only the two values needed to hold or coast.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Runtime admission checks the numbers. The water's density and the profile determine whether buoyancy can carry the body.
 */
export interface IAutoMovieMotionHumanSwimImmersed {
  /** The water's world surface and optional density. */
  water: IAutoMovieMotionHumanWater;

  /** Positive finite duration, seconds. */
  seconds: number;

  /** Nonnegative finite head-first speed at entry, m/s. Omit it to float in place. */
  speed?: number;
}
