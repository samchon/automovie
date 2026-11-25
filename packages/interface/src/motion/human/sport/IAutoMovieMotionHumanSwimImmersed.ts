import type { IAutoMovieMotionHumanWater } from "../perform/IAutoMovieMotionHumanWater";

/** A supine float, passive head-first glide or one immersed breaststroke. */
export interface IAutoMovieMotionHumanSwimImmersed {
  /** The water's world surface and optional density. */
  water: IAutoMovieMotionHumanWater;

  /** Positive finite duration, seconds. */
  duration: number;

  /**
   * Nonnegative finite head-first speed at passive entry, m/s. Omit it to float
   * in place or to start the stroke from rest.
   */
  speed?: number;

  /** One prone stroke from rest. Omit it for the passive supine action. */
  stroke?: "breaststroke";
}
