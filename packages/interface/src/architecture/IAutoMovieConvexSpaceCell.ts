import { IAutoMovieHalfSpacePlane } from "./IAutoMovieHalfSpacePlane";

/**
 * A convex cell represented by intersecting half-spaces, meant to be bounded.
 *
 * A logical space's volume is the union of its cells. Validation requires at
 * least four finite, non-zero planes but does not prove that they enclose a
 * bounded, non-empty region; an unbounded cell yields fewer corners from
 * `builtConvexCellVertices` and still answers containment.
 *
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
