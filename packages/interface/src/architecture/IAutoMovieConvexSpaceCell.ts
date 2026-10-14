import { IAutoMovieHalfSpacePlane } from "./IAutoMovieHalfSpacePlane";

/**
 * A convex cell represented by intersecting half-spaces, meant to be bounded.
 *
 * A logical space's volume is the union of its cells. Validation requires at least four planes, finite components/offsets and finite computed normal lengths above 1e-12, but does not prove boundedness, nonemptiness or positive volume. `builtConvexCellVertices` enumerates retained triple intersections rather than proving closure: an unbounded cell can have no corners or an incomplete finite corner set, which can understate its bounds while direct containment still reads every plane.
 *
 * @evidence contracts/common.md#principled-implementation Direct containment intersects inequalities with 1e-9 slack in each authored plane's scale. Corner enumeration normalizes retained planes, solves triples and uses 1e-6 for normal rejection, near-parallel determinants, admission distance and duplicate proximity. Those are distinct heuristics with different units; near-degenerate or extreme binary64 intermediates can lose or corrupt corners, so neither finite input admission nor four planes certifies a bounded numerical polyhedron.
 * @evidence contracts/common.md#clear-and-simple-design An id and a plane list are the whole cell, and the region's union, hierarchy, and fidelity stay on `IAutoMovieBuiltSpace`, so the cell carries no bounds or vertices that could disagree with its planes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Four planes is the minimum any bounded convex polyhedron needs, not a fixture-chosen count, and the unproven boundedness is stated in the prose rather than masked by clipping to an assumed box.
 * @evidence contracts/common.md#meaningful-documentation States that cells union into the space, the inside test and that a point on a plane counts as inside, what validation checks and does not prove, and how an unbounded cell behaves.
 * @author Samchon
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
