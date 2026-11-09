import type { IAutoMovieRecoveryCameraSceneInput } from "@automovie/interface";

import type { IAutoMovieRecoveryCameraFile } from "./IAutoMovieRecoveryCameraFile";

/**
 * Fixed-byte calibrated image set for the Node cameras scene command.
 *
 * @evidence contracts/development/design.md#principled-representation Complete-byte hashes and unchanged sRGB decoding bind each supplied chart before the same automatic resident scene operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shared camera-file records own acquisition identity; the scene input owns geometry and aggregate/repeated work policy.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No directory scan, manual track, inferred pose, filename trajectory or changed image chart supplies a scene.
 * @evidence contracts/development/common.md#meaningful-documentation Members specify relative paths, source order, exact encoding, header bounds and separate host versus numerical ownership.
 */
export interface IAutoMovieRecoveryCameraSceneFiles {
  /** Versioned bounded image-set acquisition manifest. */
  schema: "automovie-recovery-camera-scene-files-v1";

  /** Exact sRGB RGB8 P6 variation without implicit chart correction. */
  encoding: "ppm-srgb-rgb8-v1";

  /** Closed resident metadata/policy/budgets; the host supplies decoded views. */
  capture: Omit<IAutoMovieRecoveryCameraSceneInput, "views">;

  /** Positive per-source P6 header-byte ceiling. */
  maxHeaderBytes: number;

  /** Fixed source set, bounded by capture.budget.maxViews; first two are the seed. */
  views: IAutoMovieRecoveryCameraFile[];
}
