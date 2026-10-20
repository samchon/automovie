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
 * @evidence contracts/common.md#principled-implementation Projection subtracts frame origin and takes two axis dot products; stored points then use round(value*1e6)/1e6 with negative zero normalized. Six-decimal output is a numerical convention, not exact decimal arithmetic: projection/rounding can overflow and distinct nearby world points can merge, while a returned page point has lost normal depth.
 * @evidence contracts/common.md#clear-and-simple-design Page coordinates stay in model metres so lengths and areas read off the page are model measurements, and scale belongs to the serializer alone, which keeps one drawing valid at every print scale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate is shifted, clamped or flipped for a consumer here; the SVG flip and margin happen only in the serializer's own placement.
 * @evidence contracts/common.md#meaningful-documentation States the metre unit, the axes and origin, the upward `y`, the rounding and `-0` rule, and where scale and the SVG flip are applied.
 */
export interface IAutoMovieDrawingPoint {
  /** Distance along the page right axis from the view origin, in metres. */
  x: number;

  /** Distance along the page up axis from the view origin, in metres. */
  y: number;
}
