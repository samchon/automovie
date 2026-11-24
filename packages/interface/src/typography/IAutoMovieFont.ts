import type { IAutoMovieFontGlyph } from "./IAutoMovieFontGlyph";
import type { IAutoMovieFontKerning } from "./IAutoMovieFontKerning";

/**
 * A TrueType font decoded into the outlines, metrics and descriptive names text
 * layout reads, all in font units.
 *
 * `ingest` decodes it from bytes (ISO/IEC 14496-22) and `render` or a host
 * hands it to `engine`, which lays text out from it without ever reading font
 * bytes. The same bytes always decode to the same record.
 *
 * Only `kern` format 0 pairs adjust spacing. `GPOS`, `GSUB` and complex-script
 * shaping are left out: no ligature, contextual form, mark placement or
 * bidirectional reordering is applied, so a script that needs them cannot be
 * set. Reopen when a production needs a script those tables shape.
 */
export interface IAutoMovieFont {
  /**
   * Font units per em from `head`, a positive integer; a size in metres divided
   * by it scales every other length here.
   */
  unitsPerEm: number;

  /** Typographic ascent above the baseline from `hhea`, font units. */
  ascender: number;

  /** Typographic descent from `hhea`, font units, negative below the baseline. */
  descender: number;

  /**
   * Extra space between lines from `hhea`, font units, nonnegative in
   * well-formed fonts.
   */
  lineGap: number;

  /** One glyph per mapped Unicode code point, in increasing code point order. */
  glyphs: IAutoMovieFontGlyph[];

  /**
   * Kerning pairs by code point, ordered by left then right code point; empty
   * when the font has no `kern` table.
   */
  kerning: IAutoMovieFontKerning[];

  /**
   * The `OS/2` table's `fsType` embedding permission bits, or `null` when the
   * font has no `OS/2` table. Descriptive: a review compares it with an asset's
   * licence record; compilation does not judge legal rights.
   */
  fsType: number | null;

  /**
   * Descriptive `name` table records, each `null` when the font does not carry
   * it.
   */
  names: {
    /** Name ID 1, the font family. */
    family: string | null;

    /** Name ID 13, the licence description. */
    licenseDescription: string | null;

    /** Name ID 14, the licence information URL. */
    licenseUrl: string | null;
  };
}
