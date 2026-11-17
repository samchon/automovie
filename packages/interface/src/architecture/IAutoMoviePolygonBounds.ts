import type { IAutoMoviePlanarPoint } from "./IAutoMoviePlanarPoint";

/** Caller-owned componentwise extrema of a polygon in its planar coordinate frame. */
export namespace IAutoMoviePolygonBounds {
  /**
   * Caller-owned componentwise extrema of a polygon in its planar coordinate frame.
   *
   * Returns componentwise extrema in polygon units as new caller-owned corners. A meaningful finite box requires non-empty finite input. Empty input retains `Infinity` minima and `-Infinity` maxima, and comparisons skip `NaN` coordinates; this function does not validate either premise.
   *
   * @evidence contracts/development/design.md#principled-representation Both corners use IAutoMoviePlanarPoint in the input's units and frame; empty input preserves Infinity minima and -Infinity maxima because polygonBounds performs no admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface polygonBounds creates these mutable corners for wall cutting, opening extents and observation-station calculations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not enforce ordered finite corners; callers must supply nonempty finite input when they need a usable box, and NaN coordinates are skipped by comparisons.
   * @evidence contracts/development/common.md#meaningful-documentation Caller-owned componentwise extrema of a polygon in its planar coordinate frame. Both corners use IAutoMoviePlanarPoint in the input's units and frame; empty input preserves Infinity minima and -Infinity maxima because polygonBounds performs no admission.
   */
  export type IResult = {
    /** New componentwise lower corner in input planar units; Infinity components for empty input. */
    min: IAutoMoviePlanarPoint;

    /** New componentwise upper corner in input planar units; -Infinity components for empty input. */
    max: IAutoMoviePlanarPoint;
  };
}
