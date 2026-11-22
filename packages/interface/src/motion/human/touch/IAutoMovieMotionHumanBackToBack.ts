import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Lean back against a seated partner's back (#4012): two people sitting back
 * to back each lean the trunk back until their upper backs meet halfway and
 * bear on each other, hold for the authored span and sit up again.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what bears on what, for how long and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The partner, the span and the partner's own lean by its anchor; the lean follows from the two seated bodies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `backToBack` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A standing performer, a partner out of the lean's reach and a support withdrawn while the other still leans are refused at runtime.
 */
export interface IAutoMovieMotionHumanBackToBack {
  /** The partner sitting back to back with the performer. */
  partner: string;

  /** How long the two lean on each other, seconds; positive. Required: no natural value is defined, so the author sets it (provisional: no timing study was read). */
  seconds: number;

  /** The anchor of the partner's own lean, placed before this one: both must lean and sit up together, or one is left leaning on nothing; unchecked when absent. */
  with?: string;

  /** How the trunk leans back and comes up. */
  manner?: IAutoMovieMotionManner;
}
