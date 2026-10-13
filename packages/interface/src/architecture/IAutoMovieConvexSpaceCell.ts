import { IAutoMovieHalfSpacePlane } from "./IAutoMovieHalfSpacePlane";

/**
 * A convex cell represented by intersecting half-spaces, meant to be bounded.
 *
 * A logical space's volume is the union of its cells. Validation requires at
 * least four finite, non-zero planes but does not prove that they enclose a
 * bounded, non-empty region; an unbounded cell yields fewer corners from
 * `builtConvexCellVertices` and still answers containment.
 *
 * @evidence contracts/common.md#principled-implementation Represents a cell as the intersection of half-spaces `dot(normal, point) <= offset`, so containment costs one dot product per plane; the bounded and non-empty premises are not verified, which is an unresolved limitation of the validator.
 * @evidence contracts/common.md#clear-and-simple-design An id and a plane list; a space carries either a cell list or a closed `shell`, never both, and its volume is the union of these cells.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no room shape; the four-plane floor is the fewest planes that can close a 3D solid, and the missing boundedness check is stated here rather than compensated for.
 * @evidence contracts/common.md#meaningful-documentation States the inside test, that cell ids are unique within one logical space, the four-plane floor, and that boundedness is assumed rather than checked.
 * @author Samchon
 */
export interface IAutoMovieConvexSpaceCell {
  /** Stable cell identity, unique within its logical space. */
  id: string;

  /**
   * At least four planes, each with the inside test
   * `dot(normal, point) <= offset`.
   */
  planes: IAutoMovieHalfSpacePlane[];
}
