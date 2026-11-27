import type { AutoMovieHumanHairColor as AutoMovieHumanHairColorContract } from "@automovie/interface";

/**
 * Colour of scalp hair, brows or lashes, as a closed choice.
 *
 * Natural hair colour follows the amounts of eumelanin (brown to black) and pheomelanin (red to yellow) in the cortex, and grey and white follow their loss with age. The choice is a colour category, not a measured pigment concentration. Hair, brows and lashes each take their own choice, because dyed hair and natural brows differ.
 */
export namespace AutoMovieHumanHairColor {
  /** Very much eumelanin. */
  export const Black: "black" = "black" satisfies
    AutoMovieHumanHairColorContract;
  /** Much eumelanin. */
  export const DarkBrown: "darkBrown" = "darkBrown" satisfies
    AutoMovieHumanHairColorContract;
  /** Moderate eumelanin. */
  export const Brown: "brown" = "brown" satisfies
    AutoMovieHumanHairColorContract;
  /** Little eumelanin. */
  export const LightBrown: "lightBrown" = "lightBrown" satisfies
    AutoMovieHumanHairColorContract;
  /** Very little melanin of either kind. */
  export const Blond: "blond" = "blond" satisfies
    AutoMovieHumanHairColorContract;
  /** Eumelanin with much pheomelanin. */
  export const Auburn: "auburn" = "auburn" satisfies
    AutoMovieHumanHairColorContract;
  /** Mostly pheomelanin. */
  export const Red: "red" = "red" satisfies AutoMovieHumanHairColorContract;
  /** A mix of pigmented and unpigmented strands. */
  export const Gray: "gray" = "gray" satisfies AutoMovieHumanHairColorContract;
  /** Unpigmented strands. */
  export const White: "white" = "white" satisfies
    AutoMovieHumanHairColorContract;
}
