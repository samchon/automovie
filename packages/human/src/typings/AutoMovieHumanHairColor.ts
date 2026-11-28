import type { AutoMovieHumanHairColor as AutoMovieHumanHairColorContract } from "@automovie/interface";

/**
 * Appearance categories shared by scalp hair, brows and lashes.
 *
 * Each appearance record chooses its own color. Use the string label as that
 * record's `color`.
 */
export namespace AutoMovieHumanHairColor {
  /** The black hair color category. */
  export const Black: "black" = "black" satisfies
    AutoMovieHumanHairColorContract;
  /** The dark brown hair color category. */
  export const DarkBrown: "darkBrown" = "darkBrown" satisfies
    AutoMovieHumanHairColorContract;
  /** The unqualified brown hair color category. */
  export const Brown: "brown" = "brown" satisfies
    AutoMovieHumanHairColorContract;
  /** The light brown hair color category. */
  export const LightBrown: "lightBrown" = "lightBrown" satisfies
    AutoMovieHumanHairColorContract;
  /** The blond hair color category. */
  export const Blond: "blond" = "blond" satisfies
    AutoMovieHumanHairColorContract;
  /** The auburn hair color category. */
  export const Auburn: "auburn" = "auburn" satisfies
    AutoMovieHumanHairColorContract;
  /** The red hair color category. */
  export const Red: "red" = "red" satisfies AutoMovieHumanHairColorContract;
  /** The gray hair color category. */
  export const Gray: "gray" = "gray" satisfies AutoMovieHumanHairColorContract;
  /** The white hair color category. */
  export const White: "white" = "white" satisfies
    AutoMovieHumanHairColorContract;
}
