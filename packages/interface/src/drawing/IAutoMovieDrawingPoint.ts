/**
 * A point on the drawing page, in model metres.
 *
 * `x` runs along the view frame's right axis and `y` along its up axis, both
 * measured from the projection of the view origin, with `y` growing upward.
 * Every point a derivation stores is rounded to six decimals and never holds
 * `-0`. The drafting scale is not applied here: only `drawingToSvg`
 * converts metres to page millimetres, at `1000 / scale` per metre, and flips
 * `y` for SVG's downward axis.
 */
export interface IAutoMovieDrawingPoint {
  /** Distance along the page right axis from the view origin, in metres. */
  x: number;

  /** Distance along the page up axis from the view origin, in metres. */
  y: number;
}
