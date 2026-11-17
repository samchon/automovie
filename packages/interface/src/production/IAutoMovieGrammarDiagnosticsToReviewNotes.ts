import type { IAutoMovieGrammarDiagnostic } from "../cinematics/IAutoMovieGrammarDiagnostic";

/**
 * Data and callback contracts shared by the GrammarDiagnosticsToReviewNotes operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation File film-grammar findings as visual review notes on one beat. Member documentation states the supplied records, units and absence meanings used by grammarDiagnosticsToReviewNotes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No severity or shot field is invented on the review-note shape; the caller scopes diagnostics to the beat's shot or incoming cut.
 * @evidence contracts/development/design.md#principled-representation beat locates the backlog entry while diagnostics carries ordered film-grammar findings; the conversion preserves code/fact/impact/recovery in visual-tier notes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieGrammarDiagnosticsToReviewNotes, used by grammarDiagnosticsToReviewNotes. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieGrammarDiagnosticsToReviewNotes {
  /**
   * File film-grammar findings as visual review notes on one beat.
   *
   * Each diagnostic becomes one `visual`-tier note, in input order, whose `issue` reads `<code>: <fact>; <impact>` and whose `suggestion` is the diagnostic's `recovery`. The note shape has no severity or shot field, so `severity`, `shot` and `previousShot` are not carried: the caller passes the findings of one shot or its incoming cut, so `beat` locates the note, and an `"error"` finding files at the same tier as a `"warning"`. `reviewVisualRead` puts these notes ahead of its own framing, contact and silhouette notes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation File film-grammar findings as visual review notes on one beat. Member documentation states the supplied records, units and absence meanings used by grammarDiagnosticsToReviewNotes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No severity or shot field is invented on the review-note shape; the caller scopes diagnostics to the beat's shot or incoming cut.
   * @evidence contracts/development/design.md#principled-representation beat locates the backlog entry while diagnostics carries ordered film-grammar findings; the conversion preserves code/fact/impact/recovery in visual-tier notes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieGrammarDiagnosticsToReviewNotes.IProps, used by grammarDiagnosticsToReviewNotes. Its beat, diagnostics members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Narrative beat that owns the review backlog. */
    beat: string;

    /** Mechanical grammar findings to file, in the order to file them. */
    diagnostics: readonly IAutoMovieGrammarDiagnostic[];
  };
}
