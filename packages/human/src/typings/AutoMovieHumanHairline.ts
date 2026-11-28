import type { AutoMovieHumanHairline as AutoMovieHumanHairlineContract } from "@automovie/interface";

/**
 * Frontal contour labels for scalp hair.
 *
 * Set `hairline` in the scalp-hair record. The anatomy reference describes the
 * contours. Length, color and curl remain separate fields.
 */
export namespace AutoMovieHumanHairline {
  /** A smooth concave contour across the forehead and temples. */
  export const Round: "round" = "round" satisfies
    AutoMovieHumanHairlineContract;
  /** A contour with marked recession at the temples. */
  export const MShaped: "mShaped" = "mShaped" satisfies
    AutoMovieHumanHairlineContract;
  /** A horizontal frontal margin with mild temple recession. */
  export const Rectangular: "rectangular" = "rectangular" satisfies
    AutoMovieHumanHairlineContract;
  /** A contour with a raised midline and ordinary forehead width. */
  export const BellShaped: "bellShaped" = "bellShaped" satisfies
    AutoMovieHumanHairlineContract;
  /**
   * A contour that descends nearly straight from the forehead center to the
   * temples.
   */
  export const Triangular: "triangular" = "triangular" satisfies
    AutoMovieHumanHairlineContract;
}
