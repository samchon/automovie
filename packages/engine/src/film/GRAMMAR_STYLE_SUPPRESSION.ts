import { AutoMovieGrammarStyleIntent } from "@automovie/interface";
import { AutoMovieGrammarDiagnosticCode } from "./AutoMovieGrammarDiagnosticCode";

/**
 * Exact one-to-one suppression table for deliberate grammar exceptions.
 *
 * @evidence requirements/editorial/continuity-and-film-grammar.md#editorial-grammar-violation GRAMMAR_STYLE_SUPPRESSION makes grammar violations actionable: Exact one-to-one suppression table for deliberate grammar exceptions.
 * @evidence specifications/editorial-render-and-delivery/editorial-audiovisual-continuity.md#spec-editorial-continuity-grammar GRAMMAR_STYLE_SUPPRESSION realizes deterministic continuity-grammar analysis: Exact one-to-one suppression table for deliberate grammar exceptions.
 */
export const GRAMMAR_STYLE_SUPPRESSION: Readonly<
  Record<AutoMovieGrammarStyleIntent, AutoMovieGrammarDiagnosticCode>
> = {
  "axis-cross": "grammar-axis-crossed",
  "jump-cut": "grammar-jump-cut",
  "eyeline-break": "grammar-eyeline",
  "tight-reestablish": "grammar-reestablish",
  "rhythmic-pacing": "grammar-pacing",
};
