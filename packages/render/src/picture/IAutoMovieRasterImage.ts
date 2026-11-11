/**
 * An opaque sRGB picture as the raster tools exchange it: a frame the draw-only
 * function returned, a contact sheet, a difference image or a file a host decoded.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the four producers of such a picture; each member states its unit and layout.
 * @evidence contracts/development/design.md#principled-representation Integer size and row-major RGBA bytes are what a PNG encoder, a label stamp, a sheet and a comparison all read, so one shape passes between them without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, each read by every consumer; drawing counts stay on the frame type that has them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A picture with no drawing history, such as a decoded file, is not made to carry invented statistics.
 */
export interface IAutoMovieRasterImage {
  /** Width in pixels. */
  width: number;

  /** Height in pixels. */
  height: number;

  /** Opaque sRGB RGBA bytes, row-major from the top-left corner. */
  pixels: Uint8ClampedArray;
}
