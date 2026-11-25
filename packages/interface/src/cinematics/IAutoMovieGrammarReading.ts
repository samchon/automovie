import type { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";
import type { IAutoMovieGrammarStyleClaim } from "./IAutoMovieGrammarStyleClaim";

/**
 * Everything one mechanical pass over an edited sequence establishes: the
 * findings no declared exception excepted, and the declarations that excepted
 * nothing.
 *
 * Both halves come from the same pass. A declaration that suppresses a finding
 * and one that suppresses nothing both leave the finding list silent, so only
 * the pass that applies the suppression table can tell which declarations were
 * exercised.
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
