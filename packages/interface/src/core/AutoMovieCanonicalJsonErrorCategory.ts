/** Name the five explicit canonical-JSON domain refusal categories. */
export type AutoMovieCanonicalJsonErrorCategory =
  | "unsupported-value"
  | "invalid-unicode"
  | "cyclic-value"
  | "non-plain-container"
  | "accessor-property";
