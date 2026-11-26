import type { IAutoMovieFont } from "@automovie/interface";

import { decodeAutoMovieTrueTypeFont as decodeFont } from "./internal/decodeAutoMovieTrueTypeFont";

/** Decodes supported TrueType font bytes into reusable outline records. */
export namespace AutoMovieIngestFont {
  /**
   * Decode one TrueType font's outlines, metrics, kerning and names.
   * @param bytes Font file bytes; only read.
   * @returns Decoded font record.
   */
  export function decode(
    bytes: Uint8Array,
  ): IAutoMovieFont {
    return decodeFont(bytes);
  }
}
