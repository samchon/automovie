import type { AutoMovieProductionLanguage } from "./AutoMovieProductionLanguage";
import { AUTO_MOVIE_PRODUCTION_LANGUAGES } from "./AUTO_MOVIE_PRODUCTION_LANGUAGES";


/**
 * Whether a value is one exact supported language identity. Production graph validation separately checks the selected project's contract pack.
 *
 * @evidence contracts/common.md#principled-implementation A string type guard followed by exact registry membership narrows unknown input to one supported language identity; non-strings and other spellings return false.
 * @evidence contracts/common.md#clear-and-simple-design Graph declarations use this admission boundary and share the canonical four-name registry with the production language type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No language name is case-folded, guessed from prose or substituted after a failed match.
 * @evidence contracts/common.md#meaningful-documentation The comment states that this predicate tests supported identity only, while production graph validation checks the selected project's contract pack.
 * @evidence contracts/performance.md#efficient-algorithms The type check and at most four membership comparisons take bounded time without per-call allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work All calls reuse the module's immutable language tuple; a boolean result is not cached against mutable project state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and the predicate retains no candidate value or project handle.
 */
export const isAutoMovieProductionLanguage: (value: unknown) => value is AutoMovieProductionLanguage = (
  value: unknown,
): value is AutoMovieProductionLanguage =>
  typeof value === "string" &&
  (AUTO_MOVIE_PRODUCTION_LANGUAGES as readonly string[]).includes(value);
