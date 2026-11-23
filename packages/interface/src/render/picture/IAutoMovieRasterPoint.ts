/**
 * Top-left pixel anchor for a raster label. stampAutoMovieRasterLabel measures
 * x rightward and y downward from the image origin, rounds the anchor and moves
 * the label box back inside the image before clipping oversized content. This
 * pixel coordinate is distinct from a world-space vector.
 */
export interface IAutoMovieRasterPoint {
  /** Pixel coordinate measured rightward from the image's left edge. */
  x: number;
  /** Pixel coordinate measured downward from the image's top edge. */
  y: number;
}
