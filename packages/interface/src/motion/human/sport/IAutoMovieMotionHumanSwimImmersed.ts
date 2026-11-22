import type { IAutoMovieMotionHumanWater } from "../perform/IAutoMovieMotionHumanWater";

/**
 * A supine float, passive head-first glide or one immersed breaststroke.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the medium, span, optional stroke and passive entry speed with their units and defaults.
 * @evidence contracts/development/design.md#principled-representation The same medium and span describe a passive float or glide, or one keyed stroke starting at rest.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The registered swimImmersed law owns the opt-in stroke; the staged swim parameters retain their existing contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Runtime admission checks the numbers. The water's density and the profile determine whether buoyancy can carry the body.
 */
export interface IAutoMovieMotionHumanSwimImmersed {
  /** The water's world surface and optional density. */
  water: IAutoMovieMotionHumanWater;

  /** Positive finite duration, seconds. */
  seconds: number;

  /** Nonnegative finite head-first speed at passive entry, m/s. Omit it to float in place or to start the stroke from rest. */
  speed?: number;

  /** One prone stroke from rest. Omit it for the passive supine action. */
  stroke?: "breaststroke";
}
