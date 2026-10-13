/**
 * Stable reasons a value cannot enter canonical JSON identity.
 *
 * Each member names one violated domain rule of `automovie.canonical-json.v2`
 * rather than a host engine's error wording, so a Node capture path and a
 * browser viewer classify the same refused value identically.
 */
export type AutoMovieCanonicalJsonErrorCategory =
  | "unsupported-value"
  | "invalid-unicode"
  | "cyclic-value"
  | "non-plain-container"
  | "accessor-property";
