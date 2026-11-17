/** Closed hairline choices; serialized values are unchanged.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Closed hairline choices; serialized values are unchanged.
 * @evidence contracts/development/design.md#principled-representation Five frontal scalp-contour categories retain the conventional round, M-shaped, rectangular, bell-shaped and triangular distinctions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the vocabulary. ScalpHair stores this choice; Human docs/anatomy/hair.md records each contour's anatomical meaning.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contour category is separate from fibre style, curl and color; it adds no numerical forehead dimensions.
 */
export type AutoMovieHumanHairline =
  /** Smooth concave frontal contour without a distinct frontotemporal recession. */
  | "round"
  /** Marked frontotemporal recession with raised lateral frontal margins. */
  | "mShaped"
  /** Horizontal frontal margin with mild temporal recession. */
  | "rectangular"
  /** Bell-shaped frontal contour with a higher midline hairline. */
  | "bellShaped"
  /** Frontal margin descending nearly straight from the centre toward the temples. */
  | "triangular";
