import type { IAutoMovieRecoveryImageChart } from "./IAutoMovieRecoveryImageChart";

/**
 * Resident RGB pixels and their supplied chart for one fixed-object view.
 *
 * @evidence contracts/common.md#principled-implementation Row-major RGB8 pixels retain the chart and immutable byte identity needed by fixed-background support observation.
 * @evidence contracts/common.md#clear-and-simple-design The shared chart supplies metadata and this extension adds only resident capture bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source mesh, learned mask or silently resampled image supplies foreground support.
 * @evidence contracts/common.md#meaningful-documentation States channel order, array length, absence of alpha and borrowed-array lifetime.
 */
export interface IAutoMovieRecoveryImageView extends IAutoMovieRecoveryImageChart {
  /** Borrowed row-major unsigned sRGB bytes, exactly 3 * width * height without alpha; stable until synchronous observation returns. */
  rgb8: Uint8Array;
}
