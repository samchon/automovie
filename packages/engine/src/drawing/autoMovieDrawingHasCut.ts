import { AutoMovieDrawingProjection } from "@automovie/interface";

/**
 * Whether a projection removes material and draws what the plane passes
 * through.
 */
export const autoMovieDrawingHasCut = (
  projection: AutoMovieDrawingProjection,
): boolean => projection !== "elevation";
