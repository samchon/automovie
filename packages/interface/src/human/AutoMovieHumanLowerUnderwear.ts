/** Closed lower underwear choices; serialized values are unchanged.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Closed lower underwear choices; serialized values are unchanged.
 * @evidence contracts/development/design.md#principled-representation none/briefs/boxerBriefs select absent, brief or upper-thigh-covering lower underwear.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the vocabulary. Underwear stores the lower choice separately from its upper covering.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A single lower-garment discriminator prevents contradictory brief/boxer flags; none explicitly requests no lower covering.
 */
export type AutoMovieHumanLowerUnderwear =
  /** No lower undergarment requested. */
  | "none"
  /** Brief-style lower covering requested. */
  | "briefs"
  /** Boxer-brief lower covering requested, including upper-thigh coverage. */
  | "boxerBriefs";
