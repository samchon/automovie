/**
 * Semantic label of a bound water feature: a human-readable name for what the
 * basin is.
 *
 * It selects nothing in the solver, the surface derivation, or the viewer; the
 * physics comes from the bound fluid domain alone. `validateWaterFeatures`
 * refuses any string outside the set, and `other` names a feature none of the
 * five common names fits.
 *
 * @author Samchon
 */
export type AutoMovieWaterFeatureKind =
  | "pond"
  | "channel"
  | "fountain"
  | "waterfall"
  | "reservoir"
  | "other";
