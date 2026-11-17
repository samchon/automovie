/**
 * One label to stamp on a still.
 *
 * The anchor is borrowed plain data in output-picture pixels, not normalized coordinates. stampAutoMovieRasterLabel rounds the anchor and clamps the box inside the picture; finite coordinates remain the producer's obligation.
 *
 * @evidence contracts/development/design.md#principled-representation Text and the pixel of the picture where its box starts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Capture drawing, draw results and draw legends exchange this same text and pixel anchor; the stamp owns glyph rendering, rounding and clamping.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A box that would leave the picture is moved inside it by the stamp rather than refused.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and its frame.
 */
export interface IAutoMovieRasterLabel {
  /** The text; characters outside the stamp's font draw blank. */
  text: string;

  /** Column of the box's top-left corner, in pixels from the left. */
  x: number;

  /** Row of the box's top-left corner, in pixels from the top. */
  y: number;
}
