import { IAutoMovieHalfSpacePlane } from "@automovie/interface";

/**
 * One convex blocker an analysis ray may be stopped by.
 *
 * Both a read-only neighbouring mass and a building's own shading solid are
 * this shape, which is what lets one occlusion routine serve both without
 * either becoming the other. What a solid is _not_ is ownership: the caller
 * decides which list a solid came from, and the analysis never returns a
 * context mass as building geometry.
 *
 * A point is inside when `dot(normal, point) <= offset` for every plane. A ray
 * is stopped when the slab test leaves an entry-exit interval with a positive
 * exit before the ray's maximum distance, and a ray starting inside counts as
 * stopped at once. Validation checks the plane count, finite values and
 * non-zero normals, not that the planes enclose a non-empty bounded region.
 *
 * @author Samchon
 */
export interface IAutoMovieAnalysisSolid {
  /** Stable identity of the blocker within its own list (occluders or shades). */
  id: string;

  /**
   * Half-spaces `dot(normal, x) <= offset` whose intersection is the solid; at
   * least four, with normals of any non-zero length.
   */
  planes: readonly IAutoMovieHalfSpacePlane[];
}
