/**
 * Semantic label describing a bound water feature.
 *
 * The label selects no solver, surface or viewer behavior; computation comes
 * from the domain. validateWaterFeatures rejects words outside the set, while
 * other describes a feature outside the five named kinds.
 */
export type AutoMovieWaterFeatureKind =
  | "pond"
  | "channel"
  | "fountain"
  | "waterfall"
  | "reservoir"
  | "other";
