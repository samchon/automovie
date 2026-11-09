/**
 * Semantic label describing a bound water feature.
 *
 * The label selects no solver, surface or viewer behavior; computation comes from the domain. validateWaterFeatures rejects words outside the set, while other describes a feature outside the five named kinds.
 *
 * @evidence contracts/development/design.md#principled-representation A closed label set read only by `validateWaterFeatures` membership checks, because a pond and a waterfall differ in their domain's bed, flows and sprays, not in a mode the solver could switch on.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five common names plus `other` keep the label meaningful to a reader without a free-text field or a per-kind parameter set.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No consumer branches on the kind, so a `fountain` gains no hidden spray and a `waterfall` no hidden ledge beyond what its domain declares.
 * @evidence contracts/development/common.md#meaningful-documentation States that the label drives no computation, where the physics comes from, the validator's refusal, and what `other` is for.
 */
export type AutoMovieWaterFeatureKind =
  | "pond"
  | "channel"
  | "fountain"
  | "waterfall"
  | "reservoir"
  | "other";
