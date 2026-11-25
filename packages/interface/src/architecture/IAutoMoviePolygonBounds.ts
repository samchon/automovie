import type { IAutoMoviePlanarPoint } from "./IAutoMoviePlanarPoint";

/**
 * Caller-owned componentwise extrema of a polygon in its planar coordinate
 * frame.
 */
export namespace IAutoMoviePolygonBounds {
  /**
   * Caller-owned componentwise extrema of a polygon in its planar coordinate
   * frame.
   *
   * Returns componentwise extrema in polygon units as new caller-owned corners.
   * A meaningful finite box requires non-empty finite input. Empty input
   * retains `Infinity` minima and `-Infinity` maxima, and comparisons skip
   * `NaN` coordinates; this function does not validate either premise.
   */
  export type IResult = {
    /**
     * New componentwise lower corner in input planar units; Infinity components
     * for empty input.
     */
    min: IAutoMoviePlanarPoint;

    /**
     * New componentwise upper corner in input planar units; -Infinity
     * components for empty input.
     */
    max: IAutoMoviePlanarPoint;
  };
}
