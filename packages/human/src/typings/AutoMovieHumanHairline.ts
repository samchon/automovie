import type { AutoMovieHumanHairline as AutoMovieHumanHairlineContract } from "@automovie/interface";

/** Closed hairline choices; serialized values are unchanged. */
export const AutoMovieHumanHairline = {
  /** Smooth concave frontal contour without a distinct frontotemporal recession. */
  Round: "round",
  /** Marked frontotemporal recession with raised lateral frontal margins. */
  MShaped: "mShaped",
  /** Horizontal frontal margin with mild temporal recession. */
  Rectangular: "rectangular",
  /** Bell-shaped frontal contour with a higher midline hairline. */
  BellShaped: "bellShaped",
  /** Frontal margin descending nearly straight from the centre toward the temples. */
  Triangular: "triangular",
} as const satisfies Readonly<Record<string, AutoMovieHumanHairlineContract>>;
