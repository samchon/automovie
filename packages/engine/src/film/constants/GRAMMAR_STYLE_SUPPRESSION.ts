import { AutoMovieGrammarStyleIntent } from "@automovie/interface";

import { AutoMovieGrammarDiagnosticCode } from "../AutoMovieGrammarDiagnosticCode";

/** Exact one-to-one suppression table for deliberate grammar exceptions. */
export const GRAMMAR_STYLE_SUPPRESSION: Readonly<
  Record<AutoMovieGrammarStyleIntent, AutoMovieGrammarDiagnosticCode>
> = {
  "axis-cross": "grammar-axis-crossed",
  "jump-cut": "grammar-jump-cut",
  "eyeline-break": "grammar-eyeline",
  "tight-reestablish": "grammar-reestablish",
  "rhythmic-pacing": "grammar-pacing",
};
