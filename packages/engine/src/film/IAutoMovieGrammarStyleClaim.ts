import { AutoMovieGrammarStyleIntent } from "@automovie/interface";

/**
 * One deliberate exception and the shot whose contract declared it.
 *
 * `readFilmGrammar` lists, in {@link IAutoMovieGrammarReading.unmatched}, every
 * claim whose intent excepted no finding in the edit, and the production
 * film-grammar pass files each as a `grammar-style-intent-unmatched` warning.
 *
 * @evidence contracts/development/design.md#principled-representation A claim is the pair of shot id and intent, the exact key `readFilmGrammar` marks as exercised when the intent excepts a finding, so an unmatched claim is precisely a declared pair the suppression never used.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields, the declaring shot and the intent, which are what the warning names; the suppressed finding family is derived from the intent by `GRAMMAR_STYLE_SUPPRESSION` instead of being stored again.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No intent is exempt from being reported unmatched, and a shot declaring the same intent twice is refused by the analyzer rather than collapsed into one claim.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the list it appears in, the consumer and the warning it becomes, and what each field names.
 */
export interface IAutoMovieGrammarStyleClaim {
  /** Id of the shot whose contract declared the exception. */
  shot: string;

  /** The declared deliberate break. */
  intent: AutoMovieGrammarStyleIntent;
}
