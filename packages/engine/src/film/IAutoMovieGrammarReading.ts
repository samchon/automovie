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
 */
export interface IAutoMovieGrammarReading {
  /** Findings no declared exception excepted, in analyzer order. */
  reported: IAutoMovieGrammarDiagnostic[];
  /** Declarations that found nothing to except, in shot order. */
  unmatched: IAutoMovieGrammarStyleClaim[];
}
