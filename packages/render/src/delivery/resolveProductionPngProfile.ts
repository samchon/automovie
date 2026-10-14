import { AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS } from "@automovie/engine";

import type { AutoMovieProductionPngRole } from "./AutoMovieProductionPngRole";
import type { IAutoMovieProductionPngProfile } from "./IAutoMovieProductionPngProfile";

/**
 * Resolve one output role to the exact PNG profile its writer must emit.
 *
 * A `waveform` or `spectrogram` picture takes the fixed size the engine's
 * sound-evidence writers draw, and `width` and `height` are ignored for it. A
 * `preview` or `guide-frame` picture takes the authored raster passed in
 * `width` and `height`, in pixels. Every other profile field is the one
 * literal the writers support: 8-bit straight-alpha RGBA, sRGB, square,
 * upright and not interlaced. Throws when the resolved raster is not a
 * positive safe-integer size, which includes a preview or guide frame called
 * without one.
 *
 * @evidence contracts/common.md#principled-implementation Fixed sound-evidence sizes come from the engine writers' raster constants; other roles require positive safe-integer dimensions. This admits numeric profile records rather than encoded images and imposes no PNG field-width or decoder allocation limit; those remain serialization and probing concerns.
 * @evidence contracts/common.md#clear-and-simple-design One role switch picks the raster and one object literal spells the single supported format, so the profile shape stays in `IAutoMovieProductionPngProfile` and the comparison stays in `assertProductionPngPicture`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No caller or file is special-cased: the two fixed sizes are the engine writers' own defaults imported rather than restated, and a missing authored raster throws instead of falling back to a guessed size.
 * @evidence contracts/common.md#meaningful-documentation The doc says which roles take a fixed size and which take the passed raster, that the size arguments are pixels and ignored for fixed roles, which literals every profile carries, and when the call throws.
 * @evidence contracts/performance.md#efficient-algorithms The call does constant work: one role comparison, four integer checks and one eleven-field object, independent of image size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call builds one small profile from its arguments and coordinates no phases or requests whose work could be shared.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The PNG profile is a fresh eleven-field record handed to the validator that requested it; the engine raster constant is read, never retained, and no file handle or task is opened.
 */
export const resolveProductionPngProfile: (props: {
  role: AutoMovieProductionPngRole;
  width?: number;
  height?: number;
}) => IAutoMovieProductionPngProfile = (props: {
  /** Output role selecting an engine-fixed or caller-supplied raster. */
  role: AutoMovieProductionPngRole;

  /** Pixel width required for preview/guide-frame and ignored for sound-evidence roles. */
  width?: number;

  /** Pixel height required for preview/guide-frame and ignored for sound-evidence roles. */
  height?: number;
}): IAutoMovieProductionPngProfile => {
  const raster: { width: number | undefined; height: number | undefined } =
    props.role === "waveform" || props.role === "spectrogram"
      ? AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS[props.role]
      : { width: props.width, height: props.height };
  const width: number | undefined = raster.width;
  const height: number | undefined = raster.height;
  if (
    width === undefined ||
    height === undefined ||
    Number.isSafeInteger(width) === false ||
    width <= 0 ||
    Number.isSafeInteger(height) === false ||
    height <= 0
  )
    throw new Error(
      `PNG role "${props.role}" requires a positive safe-integer raster.`,
    );
  return {
    version: 1,
    role: props.role,
    width,
    height,
    bitDepth: 8,
    color: "rgba",
    alpha: "straight",
    interlace: "none",
    colorSpace: "srgb",
    pixelAspect: "square",
    orientation: "upright",
  };
};
