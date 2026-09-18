import { IAutoMovieReviewNote } from "@automovie/interface";
import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";

/**
 * Adapt grammar diagnostics into the existing visual-review backlog socket.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-continuity-finding grammarDiagnosticsToReviewNotes supports deterministic continuity findings: Adapt grammar diagnostics into the existing visual-review backlog socket.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar grammarDiagnosticsToReviewNotes realizes deterministic continuity-grammar analysis: Adapt grammar diagnostics into the existing visual-review backlog socket.
 */
export const grammarDiagnosticsToReviewNotes = (props: {
  /** Narrative beat that owns the review backlog. */
  beat: string;
  /** Mechanical grammar findings to file. */
  diagnostics: readonly IAutoMovieGrammarDiagnostic[];
}): IAutoMovieReviewNote[] =>
  props.diagnostics.map((diagnostic) => ({
    beat: props.beat,
    tier: "visual",
    issue: `${diagnostic.code}: ${diagnostic.fact}; ${diagnostic.impact}`,
    suggestion: diagnostic.recovery,
  }));
