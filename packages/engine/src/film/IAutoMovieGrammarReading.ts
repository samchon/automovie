import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";
import { IAutoMovieGrammarStyleClaim } from "./IAutoMovieGrammarStyleClaim";

/**
 * Everything one mechanical pass over an edited sequence establishes: the
 * findings no declared exception excepted, and the declarations that excepted
 * nothing.
 *
 * Both halves come from the same pass. A declaration that suppresses a finding
 * and one that suppresses nothing both leave the finding list silent, so only
 * the pass that applies the suppression table can tell which declarations
 * were exercised.
 *
 * @evidence contracts/development/design.md#principled-representation `readFilmGrammar` marks a claim exercised at the moment it filters a finding, by `GRAMMAR_STYLE_SUPPRESSION` on the finding's own shot, or by any shot's `rhythmic-pacing` for the film-wide pacing finding, so `reported` and `unmatched` are two views of one decision and cannot disagree.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two lists answer the author's two questions, which breaks were found and which declared breaks were not, so the production pass files both without re-implementing the suppression table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Suppression is one table lookup per finding with no per-shot or per-fixture exception, and an unexercised declaration is reported rather than dropped.
 * @evidence contracts/development/common.md#meaningful-documentation States what each list holds, its order, and why both must come from one pass.
 */
export interface IAutoMovieGrammarReading {
  /**
   * Findings no declared exception excepted, in analyzer order: shot-size
   * findings in shot order, then cut findings cut by cut, then pacing.
   */
  reported: IAutoMovieGrammarDiagnostic[];

  /**
   * Declarations that excepted no finding in this edit, in shot order and,
   * within a shot, in declaration order.
   */
  unmatched: IAutoMovieGrammarStyleClaim[];
}
