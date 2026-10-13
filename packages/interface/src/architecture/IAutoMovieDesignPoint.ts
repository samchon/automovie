/**
 * One point in a frame's own source coordinates.
 *
 * Units are the frame's: pixels for a raster, user units for a vector sheet.
 * Validation keeps `x` inside `[0, bounds.width]` and `y` inside
 * `[0, bounds.height]` of the frame the mark was read from.
 *
 * @evidence contracts/common.md#principled-implementation A raw 2D coordinate kept in source units so a corrected scale or axis never rewrites the observation; `designReferenceWorldPoint` is the only conversion to metres, and `validateDesignReference` requires finite coordinates inside the owning frame's extent.
 * @evidence contracts/common.md#clear-and-simple-design Two numbers with no unit or axis field, because the owning frame states both and every point of one frame shares them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sheet orientation is assumed; `y` grows however the source grows it, and the frame's `axisY` says where that direction lies in the world.
 * @evidence contracts/common.md#meaningful-documentation States the frame-relative unit, the y-direction convention, and the inclusive bounds a point must lie within.
 * @author Samchon
 */
export interface IAutoMovieDesignPoint {
  /** Finite source-space x. */
  x: number;

  /** Finite source-space y, growing the way the source grows it. */
  y: number;
}
