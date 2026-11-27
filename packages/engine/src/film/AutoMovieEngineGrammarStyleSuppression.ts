import {
  type AutoMovieGrammarDiagnosticCode,
  AutoMovieGrammarStyleIntent,
} from "@automovie/interface";

/** Exact one-to-one suppression table for deliberate grammar exceptions. */
export const AutoMovieEngineGrammarStyleSuppression: Readonly<
  Record<AutoMovieGrammarStyleIntent, AutoMovieGrammarDiagnosticCode>
> = {
  "axis-cross": "grammar-axis-crossed",
  "jump-cut": "grammar-jump-cut",
  "eyeline-break": "grammar-eyeline",
  "tight-reestablish": "grammar-reestablish",
  "rhythmic-pacing": "grammar-pacing",
};
