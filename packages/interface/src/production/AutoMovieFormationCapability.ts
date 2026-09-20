/**
 * Review-facing formation behavior vocabulary.
 *
 * The builder does not infer or restrict source motion from these labels.
 * Observable shot predicates and review evidence remain authoritative.
 *
 * @evidence requirements/formations/budgets-and-validation.md#formation-motion-validation Exposes `AutoMovieFormationCapability` as the portable data boundary for the formation motion validation requirement.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-geometry-layout-motion-validation Types `AutoMovieFormationCapability` for the performance formation geometry layout motion validation system contract.
 */
export type AutoMovieFormationCapability =
  | "hold"
  | "advance"
  | "wheel"
  | "charge"
  | "break"
  | "retreat";
