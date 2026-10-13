/**
 * A point on the drawing page, in metres of model measured on the page.
 *
 * `x` runs along the view frame's right axis and `y` along its up axis, both
 * measured from the view origin's projection. Points a derivation produces are
 * rounded to six decimals. The drafting scale is not applied here: only the SVG
 * serializer converts metres to page millimetres, at `1000 / scale` per metre.
 *
 * @evidence contracts/common.md#principled-implementation `projectAutoMovieDrawingPoint` takes the dot products of a world point's offset from the view origin with the frame's right and up unit vectors, an orthographic projection that keeps in-plane lengths in metres; the derivation then rounds each coordinate to six decimals so digests compare across runs.
 * @evidence contracts/common.md#clear-and-simple-design Two numbers and no unit or frame field, because every point of one drawing shares that drawing's frame and the metre unit; deferring paper scaling to `autoMovieDrawingToSvg` keeps a scale change from altering any derived coordinate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stored points are never flipped per consumer: the reflected ceiling plan's mirror lives once in the frame's negated right axis, and the downward SVG y axis is handled only inside the serializer.
 * @evidence contracts/common.md#meaningful-documentation Gives the unit as model metres rather than paper millimetres, the two axes and origin, the six-decimal rounding, and where the drafting scale is applied.
 * @author Samchon
 */
export interface IAutoMovieDrawingPoint {
  /** Distance along the page right axis, in metres. */
  x: number;

  /** Distance along the page up axis, in metres. */
  y: number;
}
