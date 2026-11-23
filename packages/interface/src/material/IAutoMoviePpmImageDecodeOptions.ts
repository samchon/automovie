import type { IAutoMovieRgb8Image } from "./IAutoMovieRgb8Image";

/**
 * Explicit allocation limits and sample interpretation for one raw P6 decode.
 *
 * The ingest decoder requires every field; it has no default budgets or
 * transfer guess. Invalid limits, unsupported headers, incomplete rasters and
 * trailing bytes throw before a result is returned. Limits bound parsing and
 * the detached raster allocation, not the caller's already resident source
 * buffer.
 */
export interface IAutoMoviePpmImageDecodeOptions {
  /**
   * Positive safe-integer upper bound on width * height; checked before copying
   * RGB bytes.
   */
  maxPixels: number;

  /**
   * Positive safe-integer byte ceiling from the P6 magic through the single
   * whitespace byte immediately preceding the raster.
   */
  maxHeaderBytes: number;

  /**
   * Interpretation of fixed sample values; the decoder preserves this tag and
   * performs no colour conversion.
   */
  transfer: IAutoMovieRgb8Image["transfer"];
}
