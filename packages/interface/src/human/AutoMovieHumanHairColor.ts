/**
 * Colour of scalp hair, brows or lashes, as a closed choice.
 *
 * Natural hair colour follows the amounts of eumelanin (brown to black) and pheomelanin (red to yellow) in the cortex, and grey and white follow their loss with age. The choice is a colour category, not a measured pigment concentration. Hair, brows and lashes each take their own choice, because dyed hair and natural brows differ.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Colour of scalp hair, brows or lashes, as a closed choice.
 * @evidence contracts/development/design.md#principled-representation Closed pigment-appearance categories apply independently to scalp hair, brows and lashes; no spectral value or pigment concentration is implied.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the vocabulary. ScalpHair, BrowAppearance and Eyelash own their separate color requests.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Dyed scalp hair and natural brows may choose different colors; no population-to-color inference is encoded.
 */
export type AutoMovieHumanHairColor =
  /** Very much eumelanin. */
  | "black"
  /** Much eumelanin. */
  | "darkBrown"
  /** Moderate eumelanin. */
  | "brown"
  /** Little eumelanin. */
  | "lightBrown"
  /** Very little melanin of either kind. */
  | "blond"
  /** Eumelanin with much pheomelanin. */
  | "auburn"
  /** Mostly pheomelanin. */
  | "red"
  /** A mix of pigmented and unpigmented strands. */
  | "gray"
  /** Unpigmented strands. */
  | "white";
