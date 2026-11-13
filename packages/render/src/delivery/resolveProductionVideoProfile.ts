import type { IAutoMovieProductionFrameRate } from "@automovie/interface";

import { AUTOMOVIE_MP4_SRGB_COLOUR } from "./AUTOMOVIE_MP4_SRGB_COLOUR.js";
import { AUTOMOVIE_MP4_UNITY_MATRIX } from "./AUTOMOVIE_MP4_UNITY_MATRIX.js";
import type { IAutoMovieProductionVideoProfile } from "./IAutoMovieProductionVideoProfile.js";

/**
 * Resolve an authored raster and exact frame rate to the one H.264-in-MP4
 * picture profile a video deliverable must carry.
 *
 * `width` and `height` are pixels and `frameRate` is the exact rational rate;
 * all three pass through unchecked, so the caller supplies values it already
 * validated. The rest is fixed: major brand `isom` with `isom` required among
 * the compatible brands, the unity track matrix, square pixels, and full-range
 * sRGB color code points. The returned matrix is a fresh copy, so a caller that
 * edits it cannot change the shared constant; the color record is the shared
 * constant itself, whose literal-typed fields admit no other value.
 *
 * @evidence contracts/development/implementation.md#principled-implementation The fixed fields are the ISO base media unity matrix and the ITU-T H.273 sRGB code points, read from `AUTOMOVIE_MP4_UNITY_MATRIX` and `AUTOMOVIE_MP4_SRGB_COLOUR`, the same constants the normalizer writes and the splice check reads, so the profile cannot name a matrix or color the writer does not emit.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The function only assembles the profile; validation of raster and rate stays with the callers that own the authored values, and the comparison against a probed file stays in `assertProductionVideoProfile`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No deliverable or caller is special-cased: every video deliverable gets the same fixed fields, which are standard identities rather than measured or fixture values.
 * @evidence contracts/development/common.md#meaningful-documentation The doc gives the units of the varying fields, says they are not validated here, lists every fixed field, and states which returned part is a copy and which is shared.
 * @evidence contracts/development/implementation.md#efficient-algorithms The call does constant work, copying a nine-entry matrix into one new profile and sharing the constant color record.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one small profile and coordinates no phases or requests whose work could be shared; the shared parts are already module constants.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the copied nine-entry matrix and the profile object are allocated, both owned by the caller from return; the shared color constant lives for the module's lifetime, and no handle or task is opened.
 */
export const resolveProductionVideoProfile: (props: {
  width: number;
  height: number;
  frameRate: IAutoMovieProductionFrameRate;
}) => IAutoMovieProductionVideoProfile = (props: {
  /** Validated coded/display width in pixels; forwarded without admission. */
  width: number;

  /** Validated coded/display height in pixels; forwarded without admission. */
  height: number;

  /** Caller-owned rational frames-per-second identity, shared by reference. */
  frameRate: IAutoMovieProductionFrameRate;
}): IAutoMovieProductionVideoProfile => ({
  width: props.width,
  height: props.height,
  frameRate: props.frameRate,
  brands: { major: "isom", requiredCompatible: ["isom"] },
  trackMatrix: [...AUTOMOVIE_MP4_UNITY_MATRIX],
  pixelAspect: "square",
  color: AUTOMOVIE_MP4_SRGB_COLOUR,
});
