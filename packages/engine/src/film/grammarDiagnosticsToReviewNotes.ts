import { IAutoMovieReviewNote } from "@automovie/interface";

import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";

/**
 * File film-grammar findings as visual review notes on one beat.
 *
 * Each diagnostic becomes one `visual`-tier note, in input order, whose `issue` reads `<code>: <fact>; <impact>` and whose `suggestion` is the diagnostic's `recovery`. The note shape has no severity or shot field, so `severity`, `shot` and `previousShot` are not carried: the caller passes the findings of one shot or its incoming cut, so `beat` locates the note, and an `"error"` finding files at the same tier as a `"warning"`. `reviewVisualRead` puts these notes ahead of its own framing, contact and silhouette notes.
 *
 * @returns One new note per diagnostic, in the same order.
 *
 * @evidence contracts/common.md#principled-implementation A one-to-one field mapping from the grammar record to the review-note record; it relies on the caller passing one shot's findings under that shot's beat, which is why dropping the shot fields loses no location, and the lost severity is a stated limitation of the note shape.
 * @evidence contracts/common.md#clear-and-simple-design Kept apart from `reviewVisualRead` because the grammar analyzer owns the calculation and the visual read only files the result, so the adaptation between the two record shapes has one home.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every diagnostic code maps the same way with the same tier; no code is filtered, reworded or promoted.
 * @evidence contracts/common.md#meaningful-documentation States the tier, the exact `issue` and `suggestion` formats, the order, which diagnostic fields are dropped, why the beat still locates the note, that severity is lost, and who consumes the notes.
 * @evidence contracts/performance.md#efficient-algorithms One `map` over the diagnostics, linear in their count and in the summed length of the text fields concatenated.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure mapping of one list that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned notes, one per diagnostic.
 */
export function grammarDiagnosticsToReviewNotes(props: {
  /** Narrative beat that owns the review backlog. */
  beat: string;

  /** Mechanical grammar findings to file, in the order to file them. */
  diagnostics: readonly IAutoMovieGrammarDiagnostic[];
}): IAutoMovieReviewNote[] {
  return props.diagnostics.map(
    (diagnostic: IAutoMovieGrammarDiagnostic): IAutoMovieReviewNote => ({
      beat: props.beat,
      tier: "visual",
      issue: `${diagnostic.code}: ${diagnostic.fact}; ${diagnostic.impact}`,
      suggestion: diagnostic.recovery,
    }),
  );
}
