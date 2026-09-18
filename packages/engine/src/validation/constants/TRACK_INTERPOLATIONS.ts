import { AutoMovieInterpolation } from "@automovie/interface";

/**
 * The interpolation modes {@link sampleClip} implements.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation `TRACK_INTERPOLATIONS` enumerates the interpolation modes implemented by the clip sampler.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation `TRACK_INTERPOLATIONS` keeps sampler support and track admission attached to the same interpolation identities.
 */
export const TRACK_INTERPOLATIONS = new Set<AutoMovieInterpolation>([
  "step",
  "linear",
  "cubicspline",
]);
