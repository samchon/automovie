import type { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * An authored planar region with one outer contour and optional interior voids.
 *
 * Coordinates use one local XY frame in metres. Contours close implicitly and
 * accept either winding. The Engine planar-region operations admit rings and
 * enforce simplicity, nonzero area and strict hole containment.
 */
export interface IAutoMoviePlanarRegion {
  /** Borrowed outer contour with at least three finite points. */
  outer: readonly IAutoMovieProfilePoint[];

  /**
   * Borrowed disjoint contours strictly inside the outer contour. An absent or
   * empty list describes a region with no voids.
   */
  holes?: readonly (readonly IAutoMovieProfilePoint[])[] | undefined;
}
