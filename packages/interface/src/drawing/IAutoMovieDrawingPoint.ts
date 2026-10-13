/**
 * A point on the drawing page, in metres of model measured on the page.
 *
 * `x` runs along the view frame's right axis and `y` along its up axis, both
 * measured from the view origin's projection. Points a derivation produces are
 * rounded to six decimals. The drafting scale is not applied here: only the SVG
 * serializer converts metres to page millimetres, at `1000 / scale` per metre.
 *
 * @author Samchon
 */
export interface IAutoMovieDrawingPoint {
  /** Distance along the page right axis, in metres. */
  x: number;

  /** Distance along the page up axis, in metres. */
  y: number;
}
