import type {
  IAutoMovieRasterComparison,
  IAutoMovieRasterImage,
  IAutoMovieRasterPoint,
} from "@automovie/interface";

import { compareRastersImplementation } from "./internal/compareRastersImplementation";
import { decodeRasterPngImplementation } from "./internal/decodeRasterPngImplementation";
import { encodeRasterPngImplementation } from "./internal/encodeRasterPngImplementation";
import { hashRasterImageImplementation } from "./internal/hashRasterImageImplementation";
import { stampRasterLabelImplementation } from "./internal/stampRasterLabelImplementation";

/** Operations on the canonical picture and raster records. */
export namespace AutoMovieRenderPicture {
  /** Compare two equal-sized pictures and return a marked difference image. */
  export function compareRasters(
    before: IAutoMovieRasterImage,
    after: IAutoMovieRasterImage,
    tolerance: number = 0,
  ): IAutoMovieRasterComparison {
    return compareRastersImplementation(before, after, tolerance);
  }

  /** Decode PNG bytes to top-down 8-bit RGBA picture data. */
  export async function decodeRasterPng(
    bytes: Uint8Array,
  ): Promise<IAutoMovieRasterImage> {
    return decodeRasterPngImplementation(bytes);
  }

  /** Encode a picture as RGB PNG, or straight-alpha RGBA when requested. */
  export async function encodeRasterPng(
    raster: IAutoMovieRasterImage,
    options?: { alpha?: boolean },
  ): Promise<Uint8Array> {
    return encodeRasterPngImplementation(raster, options);
  }

  /** Hash the size and RGB bytes of a picture as `sha256:` plus lowercase hex. */
  export function hashRasterImage(image: IAutoMovieRasterImage): string {
    return hashRasterImageImplementation(image);
  }

  /** Burn a short caption into a picture using the built-in 3-by-5 font. */
  export function stampRasterLabel(
    raster: IAutoMovieRasterImage,
    text: string,
    scale: number,
    at: IAutoMovieRasterPoint = { x: 0, y: 0 },
  ): void {
    stampRasterLabelImplementation(raster, text, scale, at);
  }
}
