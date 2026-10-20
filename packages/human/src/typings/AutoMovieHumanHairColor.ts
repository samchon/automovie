/**
 * Colour of scalp hair, brows or lashes, as a closed choice.
 *
 * Natural hair colour follows the amounts of eumelanin (brown to black) and pheomelanin (red to yellow) in the cortex, and grey and white follow their loss with age. The hair material turns a choice into strand colour and highlight; the choice is a category until a measured melanin model for hair is read. Hair, brows and lashes each take their own choice, because dyed hair and natural brows differ.
 */
export const enum AutoMovieHumanHairColor {
  /** Very much eumelanin. */
  Black = "black",

  /** Much eumelanin. */
  DarkBrown = "darkBrown",

  /** Moderate eumelanin. */
  Brown = "brown",

  /** Little eumelanin. */
  LightBrown = "lightBrown",

  /** Very little melanin of either kind. */
  Blond = "blond",

  /** Eumelanin with much pheomelanin. */
  Auburn = "auburn",

  /** Mostly pheomelanin. */
  Red = "red",

  /** A mix of pigmented and unpigmented strands. */
  Gray = "gray",

  /** Unpigmented strands. */
  White = "white",
}
