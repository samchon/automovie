import type { IAutoMovieFontSegment } from "./IAutoMovieFontSegment";

/**
 * The outline and horizontal advance a decoded font gives one Unicode code
 * point.
 *
 * Composite glyphs arrive flattened: each component's contours are already
 * moved by its offset and its 2 × 2 transform, so a consumer never resolves
 * components. Several code points that map to one glyph each carry their own
 * copy.
 */
export interface IAutoMovieFontGlyph {
  /** Unicode scalar value the font's `cmap` maps to this glyph. */
  codePoint: number;

  /** Horizontal advance from the `hmtx` table, font units, nonnegative. */
  advance: number;

  /**
   * Closed contours in font order, each a nonempty chain of quadratic segments.
   * Winding follows the font: TrueType draws filled outlines clockwise and
   * holes counter-clockwise, but a consumer groups outer rings and holes by
   * containment, not by winding. Empty for a glyph with no outline, such as a
   * space.
   */
  contours: IAutoMovieFontSegment[][];
}
