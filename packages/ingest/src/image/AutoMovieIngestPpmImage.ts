import type {
  IAutoMoviePpmImageDecodeOptions,
  IAutoMovieRgb8Image,
} from "@automovie/interface";

import { decodePpmImage as decodeImage } from "./internal/decodePpmImage";

/** Decodes one Netpbm P6 RGB8 image. */
export namespace AutoMovieIngestPpmImage {
  /**
   * Reads a binary P6 raster with maxval 255 under explicit size limits.
   *
   * Supply the transfer convention and positive integer header and pixel
   * budgets. The result preserves that convention and copies the interleaved
   * samples without color conversion. The raster begins after one whitespace
   * byte following maxval and occupies exactly three bytes per pixel.
   *
   * @param bytes Complete image bytes, borrowed for the decode.
   * @param options Transfer convention and size limits.
   * @returns Width and height in pixels, owned RGB bytes and the transfer
   *   label.
   * @throws On an unsupported header, invalid budget or incomplete or trailing
   *   data.
   */
  export function decode(
    bytes: Uint8Array,
    options: IAutoMoviePpmImageDecodeOptions,
  ): IAutoMovieRgb8Image {
    return decodeImage(bytes, options);
  }
}
