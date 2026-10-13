import { AutoMovieGrammarStyleIntent } from "@automovie/interface";

/** One deliberate exception, and the shot whose contract declared it. */
export interface IAutoMovieGrammarStyleClaim {
  /** Shot that declared the exception. */
  shot: string;
  /** Declared deliberate break. */
  intent: AutoMovieGrammarStyleIntent;
}
