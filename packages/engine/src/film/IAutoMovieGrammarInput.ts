import { IAutoMovieGrammarShotObservation } from "./IAutoMovieGrammarShotObservation";

/**
 * One edited sequence and the thresholds its mechanical read uses.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarInput supplies deterministic spatial-grammar analysis: One edited sequence and the thresholds its mechanical read uses.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarInput realizes deterministic continuity-grammar analysis: One edited sequence and the thresholds its mechanical read uses.
 */
export interface IAutoMovieGrammarInput {
  /**
   * Shots in edited playback order.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarInput.shots supplies deterministic spatial-grammar analysis: Shots in edited playback order.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarInput.shots realizes deterministic continuity-grammar analysis: Shots in edited playback order.
   */
  shots: readonly IAutoMovieGrammarShotObservation[];
  /**
   * Smallest camera-bearing change that avoids a same-size jump cut.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarInput.minimumCutAngleDegrees supplies deterministic spatial-grammar analysis: Smallest camera-bearing change that avoids a same-size jump cut.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarInput.minimumCutAngleDegrees realizes deterministic continuity-grammar analysis: Smallest camera-bearing change that avoids a same-size jump cut.
   */
  minimumCutAngleDegrees?: number;
  /**
   * Subject displacement that requires a wide re-establishing view.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarInput.reestablishDistance supplies deterministic spatial-grammar analysis: Subject displacement that requires a wide re-establishing view.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarInput.reestablishDistance realizes deterministic continuity-grammar analysis: Subject displacement that requires a wide re-establishing view.
   */
  reestablishDistance?: number;
}
