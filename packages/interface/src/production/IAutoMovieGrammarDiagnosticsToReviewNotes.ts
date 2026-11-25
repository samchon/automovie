import type { IAutoMovieGrammarDiagnostic } from "../cinematics/IAutoMovieGrammarDiagnostic";

/**
 * Data and callback contracts shared by the GrammarDiagnosticsToReviewNotes
 * operations.
 */
export namespace IAutoMovieGrammarDiagnosticsToReviewNotes {
  /**
   * File film-grammar findings as visual review notes on one beat.
   *
   * Each diagnostic becomes one `visual`-tier note, in input order, whose
   * `issue` reads `<code>: <fact>; <impact>` and whose `suggestion` is the
   * diagnostic's `recovery`. The note shape has no severity or shot field, so
   * `severity`, `shot` and `previousShot` are not carried: the caller passes
   * the findings of one shot or its incoming cut, so `beat` locates the note,
   * and an `"error"` finding files at the same tier as a `"warning"`.
   * `reviewVisualRead` puts these notes ahead of its own framing, contact and
   * silhouette notes.
   */
  export type IProps = {
    /** Narrative beat that owns the review backlog. */
    beat: string;

    /** Mechanical grammar findings to file, in the order to file them. */
    diagnostics: readonly IAutoMovieGrammarDiagnostic[];
  };
}
