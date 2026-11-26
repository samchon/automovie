import type { AutoMovieHumanHairStyle as AutoMovieHumanHairStyleContract } from "@automovie/interface";

/** Closed hair style choices; serialized values are unchanged. */
export const AutoMovieHumanHairStyle = {
  /** Cropped scalp-hair style category; this label does not itself specify fibre length. */
  Crop: "crop",
  /** Short scalp-hair style category; numerical dimensions remain producer controls. */
  Short: "short",
  /** Bob-cut scalp-hair style category with a lower cut line around the head. */
  Bob: "bob",
} as const satisfies Readonly<Record<string, AutoMovieHumanHairStyleContract>>;
