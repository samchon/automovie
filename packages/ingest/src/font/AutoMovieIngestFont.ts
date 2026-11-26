import type { IAutoMovieFont } from "@automovie/interface";

import { decodeAutoMovieTrueTypeFont as decodeFont } from "./decodeAutoMovieTrueTypeFont";

/** Decodes supported TrueType font bytes into reusable outline records. */
export class AutoMovieIngestFont {
  /**
   * Decode one TrueType font's outlines, metrics, kerning and names.
   * @param bytes Font file bytes; only read.
   * @returns Decoded font record.
   */
  public static decode(
    bytes: Uint8Array,
  ): IAutoMovieFont {
    return decodeFont(bytes);
  }
}
