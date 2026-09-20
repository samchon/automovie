import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";
import { IAutoMovieGrammarStyleClaim } from "./IAutoMovieGrammarStyleClaim";

/**
 * Everything one mechanical pass over an edited sequence establishes.
 *
 * The findings alone cannot answer the author's second question. A declaration
 * that suppresses a finding and a declaration that suppresses nothing look
 * identical from outside — both leave the diagnostic list silent — so a shot
 * declaring an exception nobody ever broke reads as a registered intent when it
 * is in fact a claim about a film that is not there. Which declarations went
 * unexercised is therefore part of the same read, computed by the one pass that
 * already decides it, rather than by a second implementation of the suppression
 * table downstream.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarReading retains the ordered findings and exception matches established by one deterministic grammar pass.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarReading realizes deterministic continuity-grammar analysis: Everything one mechanical pass over an edited sequence establishes. The findings alone cannot answer the author's second question. A declaration that suppresses a finding and a declaration that suppresses nothing look identical from outside — both leave the diagnostic list silent — so a shot declaring an exception nobody ever broke reads as a registered intent when it is in fact a claim about a film that is not there. Which declarations went unexercised is therefore part of the same read, computed by the one pass that already decides it, rather than by a second implementation of the suppression table downstream.
 */
export interface IAutoMovieGrammarReading {
  /**
   * Findings no declared exception excepted, in analyzer order.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarReading.reported supplies deterministic spatial-grammar analysis: Findings no declared exception excepted, in analyzer order.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarReading.reported realizes deterministic continuity-grammar analysis: Findings no declared exception excepted, in analyzer order.
   */
  reported: IAutoMovieGrammarDiagnostic[];
  /**
   * Declarations that found nothing to except, in shot order.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-spatial-grammar IAutoMovieGrammarReading.unmatched supplies deterministic spatial-grammar analysis: Declarations that found nothing to except, in shot order.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarReading.unmatched realizes deterministic continuity-grammar analysis: Declarations that found nothing to except, in shot order.
   */
  unmatched: IAutoMovieGrammarStyleClaim[];
}
