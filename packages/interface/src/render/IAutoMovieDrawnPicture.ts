import type { IAutoMovieRasterImage } from "./IAutoMovieRasterImage.js";
import type { IAutoMovieDrawResult } from "./IAutoMovieDrawResult.js";

/**
 * Decoded host raster beside the serialized draw receipt it came from.
 * AutoMovieDrawSession.draw validates the requested raster during decoding and
 * rejects failed or timed-out drawing. The caller owns the returned pixels;
 * result retains the original encoded pixels and camera/label observations.
 */
export interface IAutoMovieDrawnPicture {
  /** Owned decoded opaque sRGB raster. */
  picture: IAutoMovieRasterImage;
  /**
   * Original serialized pixels and inspection metadata returned by the draw
   * operation.
   */
  result: IAutoMovieDrawResult;
}
