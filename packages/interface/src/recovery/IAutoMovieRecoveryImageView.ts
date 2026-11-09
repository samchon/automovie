import type { IAutoMovieRecoveryImageChart } from "./IAutoMovieRecoveryImageChart";

/**
 * Resident RGB pixels and their supplied chart for one fixed-object view.
 *
 * @evidence contracts/development/design.md#principled-representation Row-major RGB8 pixels retain the chart and immutable byte identity needed by fixed-background support observation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared chart supplies metadata and this extension adds only resident capture bytes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source mesh, learned mask or silently resampled image supplies foreground support.
 * @evidence contracts/development/common.md#meaningful-documentation States channel order, array length, absence of alpha and borrowed-array lifetime.
 */
export interface IAutoMovieRecoveryImageView extends IAutoMovieRecoveryImageChart {
  /** Borrowed row-major unsigned sRGB bytes, exactly 3 * width * height without alpha; stable until synchronous observation returns. */
  rgb8: Uint8Array;
}
