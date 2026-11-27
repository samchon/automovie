import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Lean back against a seated partner's back: two people sitting back to back
 * each lean the trunk back until their upper backs meet halfway and bear on
 * each other, hold for the authored span and sit up again.
 */
export interface IAutoMovieMotionHumanBackToBack {
  /** The partner sitting back to back with the performer. */
  partner: string;

  /**
   * How long the two lean on each other, seconds; positive. Required: no
   * natural value is defined, so the author sets it (provisional: no timing
   * study was read).
   */
  hold: number;

  /**
   * The anchor of the partner's own lean, placed before this one: both must
   * lean and sit up together, or one is left leaning on nothing; unchecked when
   * absent.
   */
  with?: string;

  /** How the trunk leans back and comes up. */
  manner?: IAutoMovieMotionManner;
}
