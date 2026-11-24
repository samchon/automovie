import type { IAutoMovieFont } from "./IAutoMovieFont";

/**
 * Data contracts of laying a text run out from a decoded font.
 *
 * Every length is in metres in the box's own frame: the origin at the box's
 * bottom-left corner, `+x` to the reader's right and `+y` up toward the box's
 * top, so the box spans `[0, width] × [0, height]` and a glyph's outline, which
 * the font draws `+y` up from its baseline, is placed by translation and scale
 * alone.
 */
export namespace IAutoMovieLayoutText {
  /**
   * A text run to set in a box.
   *
   * `engine` refuses, each with its own diagnostic: a code point the font does
   * not map, named, which is never replaced by another glyph; a word wider than
   * the box; lines that overflow the box's height; and a nonpositive or
   * non-finite size, box edge or line height.
   */
  export interface IProps {
    /** The decoded font; `engine` never reads font bytes. */
    font: IAutoMovieFont;

    /** The text; `\n` breaks a line, and U+0020 is the only wrap opportunity. */
    text: string;

    /** Em size in metres, positive: one font unit is `size / unitsPerEm` metres. */
    size: number;

    /**
     * The box the text is set in, metres, both edges positive. A line wider
     * than `width` wraps at its last U+0020 before the limit.
     */
    box: {
      /** Box width, metres. */
      width: number;

      /** Box height, metres. */
      height: number;
    };

    /**
     * Horizontal alignment of each line in the box; default `"start"`, the left
     * edge.
     */
    align?: "start" | "center" | "end";

    /**
     * Baseline-to-baseline distance as a multiple of the font's ascender minus
     * descender plus line gap; default 1, positive.
     */
    lineHeight?: number;
  }

  /** One glyph placed on its line. */
  export interface IGlyph {
    /** The code point drawn. */
    codePoint: number;

    /** Box-local x of the glyph's origin on its baseline, metres. */
    x: number;

    /** Box-local y of the glyph's baseline, metres. */
    y: number;

    /** Zero-based line index, top line first. */
    line: number;
  }

  /** One set line. */
  export interface ILine {
    /** Advance width of the line, metres, kerning included. */
    width: number;

    /** Box-local y of the line's baseline, metres. */
    baseline: number;
  }

  /** The laid-out run. */
  export interface IResult {
    /** Placed glyphs in reading order, spaces included, line breaks omitted. */
    glyphs: IGlyph[];

    /**
     * Lines top first; the first baseline lies one scaled ascender below the
     * box's top.
     */
    lines: ILine[];

    /** Metres per font unit, `size / unitsPerEm`. */
    scale: number;
  }
}
