import { AutoMovieInterpolation } from "@automovie/interface";

/** The interpolation modes {@link sampleClip} implements. */
export const TRACK_INTERPOLATIONS = new Set<AutoMovieInterpolation>([
  "step",
  "linear",
  "cubicspline",
]);
