/**
 * Semantic label of a bound water feature: a human-readable name for what the
 * basin is.
 *
 * It selects nothing in the solver, the surface derivation, or the viewer; the
 * physics comes from the bound fluid domain alone. `validateWaterFeatures`
 * refuses any string outside the set, and `other` names a feature none of the
 * five common names fits.
 *
 * @evidence contracts/common.md#principled-implementation A closed string-literal union, so the compiler rejects a misspelled kind at authoring time and `validateWaterFeatures` rejects one at runtime against the same six literals.
 * @evidence contracts/common.md#clear-and-simple-design Six bare names with no attached parameters, because no engine or viewer code branches on the kind; `other` is the escape for a basin the five common names miss.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No literal triggers solver or render behaviour; the engine re-lists the six literals in its own `FEATURE_KINDS` set instead of deriving them from this union, so a new member must be added in both places.
 * @evidence contracts/common.md#meaningful-documentation States that the label selects no physics or rendering, which validator refuses a foreign string, and what `other` is for.
 * @author Samchon
 */
export type AutoMovieWaterFeatureKind =
  | "pond"
  | "channel"
  | "fountain"
  | "waterfall"
  | "reservoir"
  | "other";
