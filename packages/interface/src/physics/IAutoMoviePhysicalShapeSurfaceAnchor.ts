import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** World support-feature point and direction selected from an admitted collider. */
export namespace IAutoMoviePhysicalShapeSurfaceAnchor {
  /**
   * World-space support feature of a collider in a requested bone-local
   * direction.
   *
   * Point is world metres; normal is the normalized requested direction rotated
   * into world space, rather than necessarily a smooth-face normal.
   * physicalShapeSurfaceAnchor allocates both vectors after applying the shape
   * and bone transforms. Callers supply an admitted shape, pose and nonzero
   * direction. Tied box coordinates use a face centre, capsule ties a segment
   * midpoint and hull ties a mean of extreme vertices.
   */
  export type IResult = {
    /**
     * World point in metres on the selected extreme feature of the transformed
     * collider.
     */
    point: IAutoMovieVector3;

    /**
     * World unit support direction obtained from the requested bone-local
     * direction; at an edge or vertex it need not identify one unique face
     * normal.
     */
    normal: IAutoMovieVector3;
  };
}
