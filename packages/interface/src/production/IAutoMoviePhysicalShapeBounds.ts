import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** World-axis bounds of an already admitted physical shape placement. */
export namespace IAutoMoviePhysicalShapeBounds {
  /**
   * Exact world axis bounds of the admitted sphere, Y capsule, oriented box or
   * convex hull; a hull's bounds are those of its rotated points.
   */
  export type IResult = {
    /**
     * New minimum world corner in metres, exact for the represented sphere,
     * capsule, oriented box or hull under admitted transforms.
     */
    min: IAutoMovieVector3;
    /**
     * New maximum world corner in metres. Finite ordered components depend on
     * admitted shapes and representable composed arithmetic; the caller owns
     * both returned vectors.
     */
    max: IAutoMovieVector3;
  };
}
