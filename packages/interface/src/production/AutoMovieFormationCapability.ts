/**
 * Review-facing formation behavior vocabulary.
 *
 * The builder does not infer or restrict source motion from these labels.
 * Observable shot predicates and review evidence remain authoritative.
 */
export type AutoMovieFormationCapability =
  | "hold"
  | "advance"
  | "wheel"
  | "charge"
  | "break"
  | "retreat";
