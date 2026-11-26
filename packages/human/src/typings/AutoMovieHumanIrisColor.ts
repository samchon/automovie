import type { AutoMovieHumanIrisColor as AutoMovieHumanIrisColorContract } from "@automovie/interface";

/**
 * Iris colour, as a closed choice ordered from the lightest to the darkest iris.
 *
 * The choice describes an iris colour category rather than a measured pigment concentration or a stroma pattern.
 */
export namespace AutoMovieHumanIrisColor {
  /** Blue iris. */
  export const Blue: "blue" = "blue" satisfies AutoMovieHumanIrisColorContract;
  /** Grey iris. */
  export const Gray: "gray" = "gray" satisfies AutoMovieHumanIrisColorContract;
  /** Green iris. */
  export const Green: "green" = "green" satisfies
    AutoMovieHumanIrisColorContract;
  /** Hazel iris: brown near the pupil, green or grey toward the limbus. */
  export const Hazel: "hazel" = "hazel" satisfies
    AutoMovieHumanIrisColorContract;
  /** Light brown iris. */
  export const LightBrown: "lightBrown" = "lightBrown" satisfies
    AutoMovieHumanIrisColorContract;
  /** Brown iris. */
  export const Brown: "brown" = "brown" satisfies
    AutoMovieHumanIrisColorContract;
  /** Dark brown iris that reads nearly black. */
  export const DarkBrown: "darkBrown" = "darkBrown" satisfies
    AutoMovieHumanIrisColorContract;
}
