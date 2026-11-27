/**
 * A point in the metric render camera's pixel-edge chart, measured from the
 * image's upper-left edge with x increasing rightward and y downward.
 */
export interface IAutoMovieRenderPixelPoint {
  /** Horizontal pixel-edge coordinate. */
  readonly x: number;

  /** Vertical pixel-edge coordinate. */
  readonly y: number;
}
