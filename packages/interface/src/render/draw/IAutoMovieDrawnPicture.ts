import type { IAutoMovieRasterImage } from "../picture/IAutoMovieRasterImage.js";
import type { IAutoMovieDrawResult } from "./IAutoMovieDrawResult.js";

/**
 * Decoded host raster beside the serialized draw receipt it came from. AutoMovieDrawSession.draw validates the requested raster during decoding and rejects failed or timed-out drawing. The caller owns the returned pixels; result retains the original encoded pixels and camera/label observations.
 *
 * @evidence contracts/development/design.md#principled-representation AutoMovieDrawSession.draw validates the requested raster during decoding and rejects failed or timed-out drawing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieDrawSession.draw exchanges picture, result; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller owns the returned pixels; result retains the original encoded pixels and camera/label observations.
 * @evidence contracts/development/common.md#meaningful-documentation Decoded host raster beside the serialized draw receipt it came from. The prose and members document how AutoMovieDrawSession.draw interprets and admits these values.
 */
export interface IAutoMovieDrawnPicture {
  /** Owned decoded opaque sRGB raster. */
  picture: IAutoMovieRasterImage;
  /** Original serialized pixels and inspection metadata returned by the draw operation. */
  result: IAutoMovieDrawResult;
}
