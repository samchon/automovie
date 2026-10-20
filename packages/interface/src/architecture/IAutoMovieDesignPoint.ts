/**
 * One point in a frame's own source coordinates.
 *
 * Units are the frame's: pixels for a raster, user units for a vector sheet.
 * Validation keeps `x` inside `[0, bounds.width]` and `y` inside
 * `[0, bounds.height]` of the frame the mark was read from.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignReference` refuses a non-finite coordinate and one outside the owning frame's closed `[0, width]` or `[0, height]` interval; `designReferenceWorldPoint` maps the point to metres only through that frame's settled scale and axes.
 * @evidence contracts/common.md#clear-and-simple-design A bare two-number record in source units, with the frame owning every unit and placement decision, so a corrected scale never rewrites an observed point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Points are stored as read, with no y flip or rescale applied for a particular container, and a point outside its sheet is refused rather than clamped onto it.
 * @evidence contracts/common.md#meaningful-documentation States the units per container kind, the inclusive range each coordinate must stay in, and that the y direction is whatever the source uses.
 */
export interface IAutoMovieDesignPoint {
  /** Finite source-space x. */
  x: number;

  /** Finite source-space y, growing the way the source grows it. */
  y: number;
}
