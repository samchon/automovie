import type {
  IAutoMovieRasterComparison,
  IAutoMovieRasterImage,
  IAutoMovieRasterPoint,
} from "@automovie/interface";

import { compareAutoMovieRasters } from "./internal/compareAutoMovieRasters.js";
import { decodeAutoMovieRasterPng } from "./internal/decodeAutoMovieRasterPng.js";
import { encodeAutoMovieRasterPng } from "./internal/encodeAutoMovieRasterPng.js";
import { hashAutoMovieRasterImage } from "./internal/hashAutoMovieRasterImage.js";
import { stampAutoMovieRasterLabel } from "./internal/stampAutoMovieRasterLabel.js";

/** Operations on the canonical picture and raster records. */
export namespace AutoMovieRenderPicture {
  /** Compare two equal-sized pictures and return a marked difference image. */
  export function compareRasters(
    before: IAutoMovieRasterImage,
    after: IAutoMovieRasterImage,
    tolerance: number = 0,
  ): IAutoMovieRasterComparison {
    return compareAutoMovieRasters(before, after, tolerance);
  }

  /** Decode PNG bytes to top-down 8-bit RGBA picture data. */
  export async function decodeRasterPng(
    bytes: Uint8Array,
  ): Promise<IAutoMovieRasterImage> {
    return decodeAutoMovieRasterPng(bytes);
  }

  /** Encode a picture as RGB PNG, or straight-alpha RGBA when requested. */
  export async function encodeRasterPng(
    raster: IAutoMovieRasterImage,
    options?: { alpha?: boolean },
  ): Promise<Uint8Array> {
    return encodeAutoMovieRasterPng(raster, options);
  }

  /** Hash the size and RGB bytes of a picture as `sha256:` plus lowercase hex. */
  export function hashRasterImage(image: IAutoMovieRasterImage): string {
    return hashAutoMovieRasterImage(image);
  }

  /** Burn a short caption into a picture using the built-in 3-by-5 font. */
  export function stampRasterLabel(
    raster: IAutoMovieRasterImage,
    text: string,
    scale: number,
    at: IAutoMovieRasterPoint = { x: 0, y: 0 },
  ): void {
    stampAutoMovieRasterLabel(raster, text, scale, at);
  }
}
