import type { IAutoMovieHalfSpacePlane } from "./IAutoMovieHalfSpacePlane";

/**
 * A convex cell represented by intersecting half-spaces, meant to be bounded.
 *
 * A logical space's volume is the union of its cells. Validation requires at
 * least four planes, finite components/offsets and finite computed normal
 * lengths above 1e-12, but does not prove boundedness, nonemptiness or positive
 * volume. `builtConvexCellVertices` enumerates retained triple intersections
 * rather than proving closure: an unbounded cell can have no corners or an
 * incomplete finite corner set, which can understate its bounds while direct
 * containment still reads every plane.
 */
export interface IAutoMovieConvexSpaceCell {
  /** Stable cell identity, unique within its logical space. */
  id: string;

  /**
   * At least four world-space planes with finite, non-zero normals and finite
   * offsets; a point is inside when `dot(normal, point) <= offset` holds for
   * every plane, so a point on a plane counts as inside.
   */
  planes: IAutoMovieHalfSpacePlane[];
}
