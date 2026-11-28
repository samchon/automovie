import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/** Finite-segment projection used by contour correspondence and slit selection. */
export namespace IAutoMovieContourSlit64 {
  /**
   * Project the query to the closed segment using a clamped fraction.
   * Coincident endpoints give that endpoint. Supply coordinates whose
   * differences, dot products and distances stay representable.
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
     * Euclidean separation from the query to the projected point, in the input
     * length unit.
     */
    distance: number;
  };
}
