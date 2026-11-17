import type { IAutoMovieRgb8Image } from "./IAutoMovieRgb8Image";

/**
 * Explicit allocation limits and sample interpretation for one raw P6 decode.
 *
 * The ingest decoder requires every field; it has no default budgets or transfer
 * guess. Invalid limits, unsupported headers, incomplete rasters and trailing
 * bytes throw before a result is returned. Limits bound parsing and the detached
 * raster allocation, not the caller's already resident source buffer.
 *
 * @evidence contracts/development/design.md#principled-representation Positive safe-integer pixel and header-byte ceilings express the decoder's two bounded populations; admission rejects malformed values and over-budget input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Current recovery file hosts provide all three values; no codec settings beyond the supported P6 RGB8 subset are exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Transfer is declared rather than inferred from a file suffix; neither limit repairs, crops or resizes an image.
 * @evidence contracts/development/common.md#meaningful-documentation States units, inclusion of the raster delimiter, required fields, refusal and resident-source ownership.
 */
export interface IAutoMoviePpmImageDecodeOptions {
  /** Positive safe-integer upper bound on width * height; checked before copying RGB bytes. */
  maxPixels: number;

  /** Positive safe-integer byte ceiling from the P6 magic through the single whitespace byte immediately preceding the raster. */
  maxHeaderBytes: number;

  /** Interpretation of fixed sample values; the decoder preserves this tag and performs no colour conversion. */
  transfer: IAutoMovieRgb8Image["transfer"];
}
