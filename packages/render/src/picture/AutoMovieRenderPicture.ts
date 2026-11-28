import type {
  IAutoMovieRasterComparison,
  IAutoMovieRasterImage,
  IAutoMovieRasterPoint,
} from "@automovie/interface";

import { compareRastersImplementation } from "./internal/compareRastersImplementation";
import { decodeRasterPngImplementation } from "./internal/decodeRasterPngImplementation";
import { encodeRasterPngImplementation } from "./internal/encodeRasterPngImplementation";
import { hashRasterImageImplementation } from "./internal/hashRasterImageImplementation";
import { rasterLabelBox } from "./internal/rasterLabelBox";
import { stampRasterLabelImplementation } from "./internal/stampRasterLabelImplementation";

/** Operations on the canonical picture and raster records. */
export namespace AutoMovieRenderPicture {
  /** The clamped rectangle the label stamp occupies on a picture. */
  export interface ILabelBox {
    /** Leftmost painted column. */
    left: number;
    /** Topmost painted row. */
    top: number;
    /** Number of columns in the paint box. */
    width: number;
    /** Number of rows in the paint box. */
    height: number;
  }

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

  /**
   * Measure the label's paint box in pixels before stamping it.
   * The supplied anchor is rounded, then moved left or up to fit the raster.
   * Scale is a positive safe integer glyph pixel size.
   */
  export function labelBox(
    raster: Pick<IAutoMovieRasterImage, "width" | "height">,
    text: string,
    scale: number,
    at: IAutoMovieRasterPoint,
  ): ILabelBox {
    return rasterLabelBox(raster, text, scale, at);
  }

  /**
   * Burn a caption into the picture using the built-in 3-by-5 font.
   * The default anchor is the top-left pixel. The same clamped rectangle as
   * {@link labelBox} is painted with an opaque background and light glyphs.
   */
  export function stampRasterLabel(
    raster: IAutoMovieRasterImage,
    text: string,
    scale: number,
    at: IAutoMovieRasterPoint = { x: 0, y: 0 },
  ): void {
    stampRasterLabelImplementation(raster, text, scale, at);
  }
}
