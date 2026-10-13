/**
 * One point in a frame's own source coordinates.
 *
 * Units are the frame's: pixels for a raster, user units for a vector sheet.
 * Validation keeps `x` inside `[0, bounds.width]` and `y` inside
 * `[0, bounds.height]` of the frame the mark was read from.
 *
 * @author Samchon
 */
export interface IAutoMovieDesignPoint {
  /** Finite source-space x. */
  x: number;

  /** Finite source-space y, growing the way the source grows it. */
  y: number;
}
