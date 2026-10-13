import { AutoMovieGrammarDiagnosticCode } from "./AutoMovieGrammarDiagnosticCode";

/**
 * One film-grammar finding: the measured fact, its editorial consequence, and a
 * concrete recovery.
 *
 * `readFilmGrammar` produces it. The production film-grammar pass files every
 * one except `grammar-pacing` as a builder warning, and
 * `grammarDiagnosticsToReviewNotes` turns findings into visual review notes.
 *
 * @evidence contracts/common.md#principled-implementation Each finding is a deterministic geometric measurement of camera and subject observations, and severity follows what the measurement can establish: a crossed action axis and a reversed screen direction are objective reversals of screen geography and are errors, the shot-size, jump-cut, eyeline and re-establishing checks are threshold heuristics and warn, and pacing is a statistic and advises.
 * @evidence contracts/common.md#clear-and-simple-design Fact, impact and recovery are separate strings so a consumer can file them in its own channel, as the builder and the review-note adapter both do, while `code` and `severity` stay machine-readable.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No finding is filtered by shot id or fixture; a deliberate break is excepted only through a declared style intent, which `readFilmGrammar` records as exercised.
 * @evidence contracts/common.md#meaningful-documentation States the producer and consumers, the severity of each family, which shot a finding is filed on, when `previousShot` is null, and what each text field contains.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; the measurements are answered on `readFilmGrammar`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built fresh per reading; nothing caches findings across edits.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Strings held by value; one reading files at most one pacing finding, one shot-size finding per shot, and at most five per cut, one per cut family.
 * @author Samchon
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
