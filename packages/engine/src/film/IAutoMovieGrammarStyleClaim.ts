import { AutoMovieGrammarStyleIntent } from "@automovie/interface";

/**
 * One deliberate exception and the shot whose contract declared it.
 *
 * `readFilmGrammar` lists, in {@link IAutoMovieGrammarReading.unmatched}, every
 * claim whose intent excepted no finding in the edit, and the production
 * film-grammar pass files each as a `grammar-style-intent-unmatched` warning.
 *
 * @evidence contracts/common.md#principled-implementation A claim is the pair of shot id and intent, the exact key `readFilmGrammar` marks as exercised when the intent excepts a finding, so an unmatched claim is precisely a declared pair the suppression never used.
 * @evidence contracts/common.md#clear-and-simple-design Two fields, the declaring shot and the intent, which are what the warning names; the suppressed finding family is derived from the intent by `GRAMMAR_STYLE_SUPPRESSION` instead of being stored again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No intent is exempt from being reported unmatched, and a shot declaring the same intent twice is refused by the analyzer rather than collapsed into one claim.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the list it appears in, the consumer and the warning it becomes, and what each field names.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record built in constant time per declared intent.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built fresh per reading; nothing caches claims.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One string and one literal held by value, bounded by the intents declared across the shots.
 */
export interface IAutoMovieGrammarStyleClaim {
  /** Id of the shot whose contract declared the exception. */
  shot: string;

  /** The declared deliberate break. */
  intent: AutoMovieGrammarStyleIntent;
}
