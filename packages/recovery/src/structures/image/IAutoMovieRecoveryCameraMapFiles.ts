import type { IAutoMovieRecoveryCameraMapInput } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraFile } from "./IAutoMovieRecoveryCameraFile";

/**
 * Three fixed-byte sRGB P6 images for the Node calibrated-map command.
 * Paths are relative to the manifest; decoding preserves the supplied chart.
 *
 * @evidence contracts/common.md#principled-implementation Explicit complete-byte SHA identities and unchanged RGB decoding bind each calibrated view before the resident automatic map operation.
 * @evidence contracts/common.md#clear-and-simple-design Shared camera file records provide acquisition while the resident map input owns geometry and work policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No directory discovery, transformed image, inferred calibration, manual point or unverified source byte supplies a map.
 * @evidence contracts/common.md#meaningful-documentation Members define path base, explicit transfer function, first-two seed order, source-byte/header limits and supplied calibration premises.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased manifest performs no acquisition or fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no effectful cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The Node consumer owns acquired files and decoded buffers; this declaration acquires none.
 */
export interface IAutoMovieRecoveryCameraMapFiles {
  /** Versioned three-view map acquisition manifest. */
  schema: "automovie-recovery-camera-map-files-v1";

  /** Exact sRGB RGB8 P6 variation, with no implicit camera correction. */
  encoding: "ppm-srgb-rgb8-v1";

  /** Closed resident metadata/policy/budgets; the host supplies views below. */
  capture: Omit<IAutoMovieRecoveryCameraMapInput, "views">;

  /** Positive maximum P6 header bytes per image. */
  maxHeaderBytes: number;

  /** Exactly three source-order images; the first two define the seed. */
  views: IAutoMovieRecoveryCameraFile[];
}
