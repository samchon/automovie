import { AutoMovieGrammarStyleIntent } from "@automovie/interface";

/**
 * One deliberate exception, and the shot whose contract declared it.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-grammar-violation IAutoMovieGrammarStyleClaim makes grammar violations actionable: One deliberate exception, and the shot whose contract declared it.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarStyleClaim realizes deterministic continuity-grammar analysis: One deliberate exception, and the shot whose contract declared it.
 */
export interface IAutoMovieGrammarStyleClaim {
  /**
   * Shot that declared the exception.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-grammar-violation IAutoMovieGrammarStyleClaim.shot makes grammar violations actionable: Shot that declared the exception.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarStyleClaim.shot realizes deterministic continuity-grammar analysis: Shot that declared the exception.
   */
  shot: string;
  /**
   * Declared deliberate break.
   *
   * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-grammar-violation IAutoMovieGrammarStyleClaim.intent makes grammar violations actionable: Declared deliberate break.
   * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar IAutoMovieGrammarStyleClaim.intent realizes deterministic continuity-grammar analysis: Declared deliberate break.
   */
  intent: AutoMovieGrammarStyleIntent;
}
