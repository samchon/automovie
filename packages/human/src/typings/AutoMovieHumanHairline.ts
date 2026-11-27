import type { AutoMovieHumanHairline as AutoMovieHumanHairlineContract } from "@automovie/interface";

/** Closed hairline choices; serialized values are unchanged. */
export namespace AutoMovieHumanHairline {
  /** Smooth concave frontal contour without a distinct frontotemporal recession. */
  export const Round: "round" = "round" satisfies
    AutoMovieHumanHairlineContract;
  /** Marked frontotemporal recession with raised lateral frontal margins. */
  export const MShaped: "mShaped" = "mShaped" satisfies
    AutoMovieHumanHairlineContract;
  /** Horizontal frontal margin with mild temporal recession. */
  export const Rectangular: "rectangular" = "rectangular" satisfies
    AutoMovieHumanHairlineContract;
  /** Bell-shaped frontal contour with a higher midline hairline. */
  export const BellShaped: "bellShaped" = "bellShaped" satisfies
    AutoMovieHumanHairlineContract;
  /** Frontal margin descending nearly straight from the centre toward the temples. */
  export const Triangular: "triangular" = "triangular" satisfies
    AutoMovieHumanHairlineContract;
}
