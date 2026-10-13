import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One world-space half-space plane, as used by a logical space's convex cells
 * and by an analysis context's occluders.
 *
 * A point is inside when `dot(normal, point) <= offset`. Because the normal is
 * not normalized, space containment's fixed `1e-9` slack on that dot product
 * is a distance of `1e-9 / |normal|` metres.
 *
 * @author Samchon
 */
export interface IAutoMovieHalfSpacePlane {
  /** Non-zero plane normal; it need not be normalized. */
  normal: IAutoMovieVector3;

  /** Finite plane offset in the same scale as the normal. */
  offset: number;
}
