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
 * @evidence contracts/common.md#principled-implementation `readFilmGrammar` marks a claim exercised at the moment it filters a finding, by `GRAMMAR_STYLE_SUPPRESSION` on the finding's own shot, or by any shot's `rhythmic-pacing` for the film-wide pacing finding, so `reported` and `unmatched` are two views of one decision and cannot disagree.
 * @evidence contracts/common.md#clear-and-simple-design Two lists answer the author's two questions, which breaks were found and which declared breaks were not, so the production pass files both without re-implementing the suppression table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Suppression is one table lookup per finding with no per-shot or per-fixture exception, and an unexercised declaration is reported rather than dropped.
 * @evidence contracts/common.md#meaningful-documentation States what each list holds, its order, and why both must come from one pass.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the pass and its suppression cost are answered on `readFilmGrammar`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built fresh per reading; nothing caches readings across edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns two arrays bounded by the findings filed and by the style intents declared across the shots.
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
