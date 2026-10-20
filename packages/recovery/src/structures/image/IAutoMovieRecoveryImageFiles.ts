import type { IAutoMovieRecoveryImageInput } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryImageFile } from "./IAutoMovieRecoveryImageFile";

/**
 * Fixed-byte file host for the known-camera resident capture contract.
 * Image paths resolve relative to this manifest. The P6 sRGB variation is an
 * explicit acquisition assertion, not a colour-space estimator. Decoding applies
 * no EXIF, crop, resizing, undistortion or image-space camera modification.
 *
 * @evidence contracts/common.md#principled-implementation Each explicit P6 image path and SHA-256 binds source bytes to a supplied camera chart before resident observation.
 * @evidence contracts/common.md#clear-and-simple-design Pure capture metadata is reused while the Node host alone owns file paths and decoding budgets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No implicit source discovery, hidden image transform, learned preprocessing or camera estimate is supplied by this manifest.
 * @evidence contracts/common.md#meaningful-documentation States relative paths, exact byte hashes, sRGB-variant assertion, header bound and absence of image transformations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased manifest type performs no file acquisition or decoding.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type defines no cache or shared file effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host owns descriptors and buffers; the manifest retains no resource handle.
 */
export interface IAutoMovieRecoveryImageFiles {
  /** Exact supported byte interpretation; standard BT.709 PPM needs a separately recorded conversion. */
  encoding: "ppm-srgb-rgb8";

  /** Resident capture metadata, foreground policy and aggregate observation budgets. */
  capture: Omit<IAutoMovieRecoveryImageInput, "views">;

  /** Header scan budget in bytes for each fixed P6 image. */
  maxHeaderBytes: number;

  /** Explicit same-object images and supplied charts, with no directory discovery. */
  views: IAutoMovieRecoveryImageFile[];
}
