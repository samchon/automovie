/**
 * Production-authoring languages with a complete bundled contract pack.
 *
 * @author Samchon
 */
export const AUTO_MOVIE_PRODUCTION_LANGUAGES = [
  "chinese",
  "english",
  "japanese",
  "korean",
] as const;

/**
 * One exact language contract selected by a generated production.
 *
 * @author Samchon
 */
export type AutoMovieProductionLanguage =
  (typeof AUTO_MOVIE_PRODUCTION_LANGUAGES)[number];

/**
 * True when a value selects one complete bundled language contract.
 *
 * @author Samchon
 */
export const isAutoMovieProductionLanguage = (
  value: unknown,
): value is AutoMovieProductionLanguage =>
  typeof value === "string" &&
  (AUTO_MOVIE_PRODUCTION_LANGUAGES as readonly string[]).includes(value);
