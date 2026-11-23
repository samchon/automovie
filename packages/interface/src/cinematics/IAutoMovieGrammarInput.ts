import type { IAutoMovieGrammarShotObservation } from "./IAutoMovieGrammarShotObservation";

/**
 * One edited sequence, observed shot by shot, and the two thresholds its
 * mechanical read uses.
 *
 * `readFilmGrammar` consumes it. It throws on a malformed input instead of
 * reporting it: a duplicate or blank shot id, a threshold or duration that is
 * not finite and positive, or any defect the shot observation documents.
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
