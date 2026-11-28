import type { IAutoMovieFont } from "@automovie/interface";

import { decodeTrueTypeFont as decodeFont } from "./internal/decodeTrueTypeFont";

/** Decodes a single TrueType-outline font. */
export namespace AutoMovieIngestFont {
  /**
   * Reads glyph outlines, advance widths and metadata from a TrueType font.
   *
   * Supply one uncompressed font with the standard sfnt signature or `true`.
   * Unicode character maps use format 12 when available, otherwise format 4.
   * The result uses font units and closed quadratic contours. Horizontal format
   * 0 kerning and supported naming records are optional. This decoder reads the
   * base outlines and skips hinting and checksum verification.
   *
   * @param bytes Complete font bytes, borrowed for the decode.
   * @returns Owned font metrics, glyphs, kerning and available names.
   * @throws On unsupported containers or outlines, malformed required fields,
   *   or a read outside a declared table, subtable or glyph extent.
   */
  export function decode(bytes: Uint8Array): IAutoMovieFont {
    return decodeFont(bytes);
  }
}
