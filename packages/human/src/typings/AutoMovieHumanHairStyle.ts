import type { AutoMovieHumanHairStyle as AutoMovieHumanHairStyleContract } from "@automovie/interface";

/** Closed hair style choices; serialized values are unchanged. */
export namespace AutoMovieHumanHairStyle {
  /** Cropped scalp-hair style category; this label does not itself specify fibre length. */
  export const Crop: "crop" = "crop" satisfies AutoMovieHumanHairStyleContract;
  /** Short scalp-hair style category; numerical dimensions remain producer controls. */
  export const Short: "short" = "short" satisfies
    AutoMovieHumanHairStyleContract;
  /** Bob-cut scalp-hair style category with a lower cut line around the head. */
  export const Bob: "bob" = "bob" satisfies AutoMovieHumanHairStyleContract;
}
