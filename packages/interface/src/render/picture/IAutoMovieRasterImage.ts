/**
 * An opaque sRGB picture as the raster tools exchange it: a frame the draw-only
 * function returned, a contact sheet, a difference image or a file a host
 * decoded.
 */
export interface IAutoMovieRasterImage {
  /**
   * Positive integral width in pixels; raster codecs/comparison validate
   * extents where they consume them.
   */
  width: number;

  /** Positive integral height in pixels. */
  height: number;

  /**
   * Mutable opaque sRGB RGBA bytes, row-major from the top-left corner, width *
   * height * 4 entries with alpha 255 by convention. Stamping mutates this
   * storage; callers retain ownership and coordinate sharing.
   */
  pixels: Uint8ClampedArray;
}
