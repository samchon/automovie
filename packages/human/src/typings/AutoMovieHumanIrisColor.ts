import type { AutoMovieHumanIrisColor as AutoMovieHumanIrisColorContract } from "@automovie/interface";

/**
 * Iris color categories for the pigmentation record.
 *
 * The record uses one iris category for both eyes. Its skin-pigment quantities
 * are separate fields.
 */
export namespace AutoMovieHumanIrisColor {
  /** The blue iris category. */
  export const Blue: "blue" = "blue" satisfies AutoMovieHumanIrisColorContract;
  /** The gray iris category. */
  export const Gray: "gray" = "gray" satisfies AutoMovieHumanIrisColorContract;
  /** The green iris category. */
  export const Green: "green" = "green" satisfies
    AutoMovieHumanIrisColorContract;
  /** The hazel iris category. */
  export const Hazel: "hazel" = "hazel" satisfies
    AutoMovieHumanIrisColorContract;
  /** The light brown iris category. */
  export const LightBrown: "lightBrown" = "lightBrown" satisfies
    AutoMovieHumanIrisColorContract;
  /** The unqualified brown iris category. */
  export const Brown: "brown" = "brown" satisfies
    AutoMovieHumanIrisColorContract;
  /** The dark brown iris category. */
  export const DarkBrown: "darkBrown" = "darkBrown" satisfies
    AutoMovieHumanIrisColorContract;
}
