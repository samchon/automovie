import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** Finite-segment projection used by contour correspondence and slit selection. */
export namespace IAutoMovieContourSlit64 {
  /**
   * Projection onto a finite segment; a zero-length segment remains its
   * endpoint. Finite representable projection arithmetic is a caller premise;
   * closest does not validate inputs or certify a distance bound under
   * overflow.
   */
  export type IClosestResult = {
    /**
     * Newly allocated projected point a + t*(b-a), in the supplied frame and
     * length unit.
     */
    p: AutoMovieVector3Tuple;

    /**
     * Dimensionless segment fraction clamped to [0,1]; zero for coincident
     * endpoints under finite arithmetic.
     */
    t: number;

    /**
     * Euclidean separation from the query point to p, in the input length unit,
     * not squared distance.
     */
    distance: number;
  };
}
