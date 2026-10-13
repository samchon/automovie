import { IAutoMovieHalfSpacePlane } from "@automovie/interface";

/**
 *
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
 * @evidence contracts/common.md#principled-implementation A convex solid as an intersection of half-spaces, which admits the analytic slab test in `autoMovieSolidBlocks` with no tessellation or ray marching.
 * @evidence contracts/common.md#clear-and-simple-design One shape serves context occluders and building shades; `autoMovieContextSolids` maps occluders into it and the daylight request carries shades directly, while the caller keeps ownership by list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validation refuses fewer than four planes, non-finite values and zero normals but never proves the planes bound a non-empty finite region; an unbounded set blocks whatever rays its planes dictate.
 * @evidence contracts/common.md#meaningful-documentation States the inside convention, the minimum plane count, that normals need not be unit length, the inside-start rule, and what validation leaves unchecked.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record; a ray test costs two dot products per plane and belongs to the slab-test helper. One solid list is shared by every ray of a study, but the record itself computes nothing that could be reused. References its plane array, which the context or request it came from owns.
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
