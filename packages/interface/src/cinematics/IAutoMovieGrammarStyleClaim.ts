import type { AutoMovieGrammarStyleIntent } from "../production/AutoMovieGrammarStyleIntent";

/**
 * One deliberate exception and the shot whose contract declared it.
 *
 * `readFilmGrammar` lists, in {@link IAutoMovieGrammarReading.unmatched}, every
 * claim whose intent excepted no finding in the edit, and the production
 * film-grammar pass files each as a `grammar-style-intent-unmatched` warning.
 */
export interface IAutoMovieGrammarStyleClaim {
  /** Id of the shot whose contract declared the exception. */
  shot: string;

  /** The declared deliberate break. */
  intent: AutoMovieGrammarStyleIntent;
}
