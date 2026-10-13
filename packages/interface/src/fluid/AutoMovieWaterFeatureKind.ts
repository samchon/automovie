/**
 * Semantic label of a bound water feature: a human-readable name for what the
 * basin is.
 *
 * It selects nothing in the solver, the surface derivation, or the viewer; the
 * physics comes from the bound fluid domain alone. `validateWaterFeatures`
 * refuses any string outside the set, and `other` names a feature none of the
 * five common names fits.
 *
 * @evidence contracts/common.md#principled-implementation A closed label set read only by `validateWaterFeatures` membership checks, because a pond and a waterfall differ in their domain's bed, flows and sprays, not in a mode the solver could switch on.
 * @evidence contracts/common.md#clear-and-simple-design Five common names plus `other` keep the label meaningful to a reader without a free-text field or a per-kind parameter set.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer branches on the kind, so a `fountain` gains no hidden spray and a `waterfall` no hidden ledge beyond what its domain declares.
 * @evidence contracts/common.md#meaningful-documentation States that the label drives no computation, where the physics comes from, the validator's refusal, and what `other` is for.
 * @author Samchon
 */
export type AutoMovieWaterFeatureKind =
  | "pond"
  | "channel"
  | "fountain"
  | "waterfall"
  | "reservoir"
  | "other";
