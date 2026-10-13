/**
 * A point on the drawing page, in model metres.
 *
 * `x` runs along the view frame's right axis and `y` along its up axis, both
 * measured from the projection of the view origin, with `y` growing upward.
 * Every point a derivation stores is rounded to six decimals and never holds
 * `-0`. The drafting scale is not applied here: only `autoMovieDrawingToSvg`
 * converts metres to page millimetres, at `1000 / scale` per metre, and flips
 * `y` for SVG's downward axis.
 *
 * @evidence contracts/common.md#principled-implementation `projectAutoMovieDrawingPoint` takes the dot products of the world offset from the frame origin with the frame's right and up axes, and `roundAutoMovieDrawingPoint` puts both onto the six-decimal grid with negative zero normalized, so equal geometry yields equal points.
 * @evidence contracts/common.md#clear-and-simple-design Page coordinates stay in model metres so lengths and areas read off the page are model measurements, and scale belongs to the serializer alone, which keeps one drawing valid at every print scale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate is shifted, clamped or flipped for a consumer here; the SVG flip and margin happen only in the serializer's own placement.
 * @evidence contracts/common.md#meaningful-documentation States the metre unit, the axes and origin, the upward `y`, the rounding and `-0` rule, and where scale and the SVG flip are applied.
 * @author Samchon
 */
export interface IAutoMovieDrawingPoint {
  /** Distance along the page right axis from the view origin, in metres. */
  x: number;

  /** Distance along the page up axis from the view origin, in metres. */
  y: number;
}
