import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";
import { IAutoMovieGrammarInput } from "./IAutoMovieGrammarInput";
import { readFilmGrammar } from "./readFilmGrammar";

/**
 * Diagnose an ordered edit from deterministic shot observations.
 *
 * The findings half of {@link readFilmGrammar}, kept as the plain call for a
 * consumer that only files what survived.
 */
export const analyzeFilmGrammar = (
  props: IAutoMovieGrammarInput,
): IAutoMovieGrammarDiagnostic[] => readFilmGrammar(props).reported;
