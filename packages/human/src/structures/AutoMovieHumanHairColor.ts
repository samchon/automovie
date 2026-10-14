/**
 * Colour of scalp hair, brows or lashes, as a closed choice.
 *
 * Natural hair colour follows the amounts of eumelanin (brown to black) and pheomelanin (red to yellow) in the cortex, and grey and white follow their loss with age. The hair material turns a choice into strand colour and highlight; the choice is a category until a measured melanin model for hair is read. Hair, brows and lashes each take their own choice, because dyed hair and natural brows differ.
 *
 * @author Samchon
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
