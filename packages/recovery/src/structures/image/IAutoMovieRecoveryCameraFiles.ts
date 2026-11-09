import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface";

import type { IAutoMovieRecoveryCameraFile } from "./IAutoMovieRecoveryCameraFile";

/**
 * Fixed-byte P6 sRGB file acquisition for the calibrated camera-pair operation.
 * Paths resolve relative to this manifest. Decoding preserves every pixel and
 * applies no rotation, crop, resize, rectification or lens correction; prior
 * capture/decoding derivations belong to each explicit provenance record.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit file hashes bind fixed RGB8 sources to independently supplied intrinsics before automatic image observation. A declared sRGB P6 variant avoids guessing a standard PPM transfer function or a camera calibration.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The resident input's camera policy and metadata are reused while the Node owner alone acquires paths, verifies complete bytes and decodes bounded rasters.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No directory discovery, implicit image transform, inferred lens, manual correspondence, source mesh or unverified capture history supplies a camera.
 * @evidence contracts/development/common.md#meaningful-documentation States relative paths, fixed-byte hashes, sRGB assertion, decode/header bounds, prior derivation provenance and unchanged pixel charts.
 */
export interface IAutoMovieRecoveryCameraFiles {
  /** Version of the fixed-byte two-view camera manifest. */
  schema: "automovie-recovery-camera-files-v1";

  /** Explicit RGB8 sRGB P6 variation; other capture formats require a recorded unchanged-chart decoding step. */
  encoding: "ppm-srgb-rgb8-v1";

  /** Resident metadata, declared method and finite budgets; views are acquired from the files below. */
  capture: Omit<IAutoMovieRecoveryCameraPairInput, "views">;

  /** Positive maximum scanned P6 header bytes per image. */
  maxHeaderBytes: number;

  /** Exactly two explicit views in the order defining the first-camera gauge. */
  views: IAutoMovieRecoveryCameraFile[];
}
