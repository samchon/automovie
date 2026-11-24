/**
 * One horizontal kerning adjustment between two code points, from a `kern`
 * table format 0 subtable.
 *
 * The decoder maps the table's glyph pairs back through `cmap`, so a pair whose
 * glyphs several code points share appears once for each code point pair.
 */
export interface IAutoMovieFontKerning {
  /** Code point of the left glyph in reading order. */
  left: number;

  /** Code point of the right glyph in reading order. */
  right: number;

  /**
   * Adjustment added to the left glyph's advance, font units; negative pulls
   * the pair together.
   */
  value: number;
}
