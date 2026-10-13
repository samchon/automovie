import { IAutoMovieHalfSpacePlane } from "./IAutoMovieHalfSpacePlane";

/** A bounded convex cell represented by intersecting half-spaces. */
export interface IAutoMovieConvexSpaceCell {
  /** Stable cell identity within the environment. */
  id: string;

  /** Planes whose inside test is `dot(normal, point) <= offset`. */
  planes: IAutoMovieHalfSpacePlane[];
}
