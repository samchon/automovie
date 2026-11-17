/** Closed hair style choices; serialized values are unchanged.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Closed hair style choices; serialized values are unchanged.
 * @evidence contracts/development/design.md#principled-representation crop/short/bob identify the existing cut-style vocabulary without embedding fibre length or material values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the vocabulary. ScalpHair owns the cut choice separately from its hairline, curl and color.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A single cut discriminator avoids combining incompatible style flags; the vocabulary does not imply a completed hair generator.
 */
export type AutoMovieHumanHairStyle =
  /** Cropped scalp-hair style category; this label does not itself specify fibre length. */
  | "crop"
  /** Short scalp-hair style category; numerical dimensions remain producer controls. */
  | "short"
  /** Bob-cut scalp-hair style category with a lower cut line around the head. */
  | "bob";
