import type {
  IAutoMoviePpmImageDecodeOptions,
  IAutoMovieRgb8Image,
} from "@automovie/interface";

import { decodeAutoMoviePpmImage as decodeImage } from "./decodeAutoMoviePpmImage";

/** Decodes bounded P6 RGB8 PPM images under an explicit transfer policy. */
export class AutoMovieIngestPpmImage {
  /**
   * Decode one P6 RGB8 image.
   * @param bytes PPM bytes; only read.
   * @param options Explicit transfer convention and size limits.
   * @returns The RGB8 raster and dimensions.
   */
  public static decode(
    bytes: Uint8Array,
    options: IAutoMoviePpmImageDecodeOptions,
  ): IAutoMovieRgb8Image {
    return decodeImage(bytes, options);
  }
}
