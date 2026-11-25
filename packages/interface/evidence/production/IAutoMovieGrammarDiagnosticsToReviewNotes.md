# src/production/IAutoMovieGrammarDiagnosticsToReviewNotes.ts#IAutoMovieGrammarDiagnosticsToReviewNotes.IProps

## @evidence contracts/development/common.md#meaningful-documentation

File film-grammar findings as visual review notes on one beat. Member documentation states the supplied records, units and absence meanings used by grammarDiagnosticsToReviewNotes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No severity or shot field is invented on the review-note shape; the caller scopes diagnostics to the beat's shot or incoming cut.

## @evidence contracts/development/design.md#principled-representation

beat locates the backlog entry while diagnostics carries ordered film-grammar findings; the conversion preserves code/fact/impact/recovery in visual-tier notes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieGrammarDiagnosticsToReviewNotes.IProps, used by grammarDiagnosticsToReviewNotes. Its beat, diagnostics members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
