import {
  type IAutoMovieGrammarDiagnostic,
  type IAutoMovieGrammarDiagnosticsToReviewNotes,
  IAutoMovieReviewNote,
} from "@automovie/interface";

/*
 * File film-grammar findings as visual review notes on one beat.
 *
 * Each diagnostic becomes one `visual`-tier note, in input order, whose `issue`
 * reads `<code>: <fact>; <impact>` and whose `suggestion` is the diagnostic's
 * `recovery`. The note shape has no severity or shot field, so `severity`,
 * `shot` and `previousShot` are not carried: the caller passes the findings of
 * one shot or its incoming cut, so `beat` locates the note, and an `"error"`
 * finding files at the same tier as a `"warning"`. `reviewVisualRead` puts
 * these notes ahead of its own framing, contact and silhouette notes.
 * Returns: One new note per diagnostic, in the same order.
 */
export function grammarDiagnosticsToReviewNotes(
  props: IAutoMovieGrammarDiagnosticsToReviewNotes.IProps,
): IAutoMovieReviewNote[] {
  return props.diagnostics.map(
    (diagnostic: IAutoMovieGrammarDiagnostic): IAutoMovieReviewNote => ({
      beat: props.beat,
      tier: "visual",
      issue: `${diagnostic.code}: ${diagnostic.fact}; ${diagnostic.impact}`,
      suggestion: diagnostic.recovery,
    }),
  );
}
