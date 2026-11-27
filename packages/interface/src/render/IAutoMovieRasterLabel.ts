/**
 * One label to stamp on a still.
 *
 * The anchor is borrowed plain data in output-picture pixels, not normalized
 * coordinates. AutoMovieRenderPicture.stampRasterLabel rounds the anchor and clamps the box
 * inside the picture; finite coordinates remain the producer's obligation.
 */
export interface IAutoMovieRasterLabel {
  /** The text; characters outside the stamp's font draw blank. */
  text: string;

  /** Column of the box's top-left corner, in pixels from the left. */
  x: number;

  /** Row of the box's top-left corner, in pixels from the top. */
  y: number;
}
