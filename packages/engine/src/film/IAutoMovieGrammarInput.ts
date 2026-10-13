import { IAutoMovieGrammarShotObservation } from "./IAutoMovieGrammarShotObservation";

/** One edited sequence and the thresholds its mechanical read uses. */
export interface IAutoMovieGrammarInput {
  /** Shots in edited playback order. */
  shots: readonly IAutoMovieGrammarShotObservation[];
  /** Smallest camera-bearing change that avoids a same-size jump cut. */
  minimumCutAngleDegrees?: number;
  /** Subject displacement that requires a wide re-establishing view. */
  reestablishDistance?: number;
}
