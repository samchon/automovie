import type { AutoMovieGrammarDiagnosticCode } from "./AutoMovieGrammarDiagnosticCode";

/**
 * One film-grammar finding: the measured fact, its editorial consequence, and a
 * concrete recovery.
 *
 * `readFilmGrammar` produces it. The production film-grammar pass files every
 * one except `grammar-pacing` as a builder warning, and
 * `grammarDiagnosticsToReviewNotes` turns findings into visual review notes.
 */
export interface IAutoMovieGrammarDiagnostic {
  /** Diagnostic family. */
  code: AutoMovieGrammarDiagnosticCode;

  /**
   * `"error"` for `grammar-axis-crossed` and `grammar-screen-direction`,
   * `"advisory"` for `grammar-pacing`, and `"warning"` for every other family.
   */
  severity: "error" | "warning" | "advisory";

  /**
   * Shot the finding is filed on: the incoming shot of a cut, the measured shot
   * of a shot-size finding, or the last shot for pacing.
   */
  shot: string;

  /** Outgoing shot of the cut for a cut finding; null otherwise. */
  previousShot: string | null;

  /** Measured fact, with the ids and rounded numbers it was read from. */
  fact: string;

  /** Why that fact can damage the audience's spatial or rhythmic read. */
  impact: string;

  /**
   * Concrete corrective options. The jump-cut, eyeline, re-establishing and
   * pacing recoveries also name the style intent that would except the
   * finding.
   */
  recovery: string;
}
