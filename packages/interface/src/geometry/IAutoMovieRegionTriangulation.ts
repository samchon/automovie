import type { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import type { IAutoMovieRegionRing } from "./IAutoMovieRegionRing";

/**
 * Canonical planar points, ring spans and counterclockwise triangles, with
 * source correspondence and enclosed area.
 */
export interface IAutoMovieRegionTriangulation {
  /**
   * Owned copy of all ring coordinates in local XY metres. The counterclockwise
   * outer ring comes first, followed by clockwise holes in input order.
   *
   * Hole bridging reuses canonical corner indices and allocates no extra points
   * in this list.
   */
  points: IAutoMovieProfilePoint[];

  /**
   * Source vertex permutation into the authored flattened rings. Each entry
   * aligns with its canonical point, including when its ring was reversed.
   *
   * Flatten the authored outer ring followed by the authored holes, preserving
   * each ring's supplied point order. Correspondence supports copying
   * per-vertex data such as IDs or exact measurements from those records.
   */
  sourceIndices: number[];

  /**
   * Contiguous spans into canonical points, outer first and holes in declared
   * order.
   */
  rings: IAutoMovieRegionRing[];

  /**
   * Zero-based canonical point ordinals in groups of three. Each emitted
   * triangle winds counterclockwise and faces local +Z.
   */
  triangles: number[];

  /**
   * Canonical signed area sum in square metres, adding the outer ring and
   * subtracting every hole. Use finite authored region coordinates.
   */
  area: number;
}
