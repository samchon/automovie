import { IAutoMovieHalfSpacePlane } from "./IAutoMovieHalfSpacePlane";

/**
 * A convex cell represented by intersecting half-spaces, meant to be bounded.
 *
 * A logical space's volume is the union of its cells. Validation requires at
 * least four finite, non-zero planes but does not prove that they enclose a
 * bounded, non-empty region; an unbounded cell yields fewer corners from
 * `builtConvexCellVertices` and still answers containment.
 *
 * @evidence contracts/common.md#principled-implementation A point is inside when every plane's `dot(normal, point) <= offset + 1e-9` holds, the standard half-space intersection; the slack is in the plane's own scale, so it is metres only for a unit normal, and boundedness is an author premise validation does not prove.
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
