import type {
  IAutoMoviePpmImageDecodeOptions,
  IAutoMovieRgb8Image,
} from "@automovie/interface";

import { decodeAutoMoviePpmImage as decodeImage } from "./internal/decodeAutoMoviePpmImage";

/** Decodes bounded P6 RGB8 PPM images under an explicit transfer policy. */
export namespace AutoMovieIngestPpmImage {
  /**
   * Decode one P6 RGB8 image.
   * @param bytes PPM bytes; only read.
   * @param options Explicit transfer convention and size limits.
   * @returns The RGB8 raster and dimensions.
   */
  export function decode(
    bytes: Uint8Array,
    options: IAutoMoviePpmImageDecodeOptions,
  ): IAutoMovieRgb8Image {
    return decodeImage(bytes, options);
  }
}
