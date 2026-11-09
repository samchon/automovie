import { IAutoMovieGrammarShotObservation } from "./IAutoMovieGrammarShotObservation";

/**
 * One edited sequence, observed shot by shot, and the two thresholds its
 * mechanical read uses.
 *
 * `readFilmGrammar` consumes it. It throws on a malformed input instead of
 * reporting it: a duplicate or blank shot id, a threshold or duration that is
 * not finite and positive, or any defect the shot observation documents.
 *
 * @evidence contracts/development/design.md#principled-representation Shot order is the edit's playback order and is read as given, while subject lists and action-axis endpoints inside each shot are normalized by id, so the result depends on the edit and not on how the caller enumerated subjects.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shots plus the only two tunable numbers the analyzer has, both optional with fixed defaults, so a caller that accepts the defaults passes the shots alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The defaults are named constants in the analyzer applied to every edit alike, and an invalid threshold throws rather than being clamped to the default.
 * @evidence contracts/development/common.md#meaningful-documentation States the consumers, the failure effect, the order meaning of `shots`, and each threshold's unit, default and valid range.
 */
export interface IAutoMovieGrammarInput {
  /** Observed shots in edited playback order; ids must be unique. */
  shots: readonly IAutoMovieGrammarShotObservation[];

  /**
   * Smallest change in camera bearing around the shared primary subject, in
   * degrees, that keeps a same-size cut from reading as a jump cut. Finite and
   * positive; defaults to 30.
   */
  minimumCutAngleDegrees?: number;

  /**
   * Primary-subject displacement across a cut, in metres, beyond which the
   * incoming shot must be wide to re-establish geography. Finite and positive;
   * defaults to 10.
   */
  reestablishDistance?: number;
}
