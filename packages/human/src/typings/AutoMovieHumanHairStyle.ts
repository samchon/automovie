import type { AutoMovieHumanHairStyle as AutoMovieHumanHairStyleContract } from "@automovie/interface";

/**
 * Cut labels for the scalp-hair record.
 *
 * The style describes the intended cut. The record supplies the longest
 * straightened fiber length in millimeters.
 */
export namespace AutoMovieHumanHairStyle {
  /**
   * A close cut over the scalp, with hair directed away from the crown whorl.
   */
  export const Crop: "crop" = "crop" satisfies AutoMovieHumanHairStyleContract;
  /** A short cut with tapered back and sides and a longer top. */
  export const Short: "short" = "short" satisfies
    AutoMovieHumanHairStyleContract;
  /**
   * A center-parted cut with a level lower edge, at most shoulder length.
   */
  export const Bob: "bob" = "bob" satisfies AutoMovieHumanHairStyleContract;
}
