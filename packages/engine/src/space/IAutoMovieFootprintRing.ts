import { IAutoMoviePlanarPoint, IAutoMovieVector3 } from "@automovie/interface";

/**
 * One closed ring of a footprint, with the plan projection and the signed area
 * the queries read.
 *
 * The planar copy is kept rather than derived per call: `spaceGround` is asked
 * per foot per frame, and mapping `(x, z)` to `(x, y)` inside that loop would
 * build one array per containment test.
 *
 * @author Samchon
 */
export interface IAutoMovieFootprintRing {
  /** The ring as authored, in world XZ. */
  readonly points: readonly IAutoMovieVector3[];

  /** The same ring as `(x, y) = (x, z)`, for the planar predicates. */
  readonly plan: readonly IAutoMoviePlanarPoint[];

  /**
   * Twice the signed plan area, positive in {@link convexHull2D}'s own winding.
   * Zero means the ring encloses nothing at all.
   */
  readonly doubleArea: number;
}
