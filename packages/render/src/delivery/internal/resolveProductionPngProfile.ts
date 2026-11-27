import { AutoMovieEngineProductionSoundEvidenceRasters } from "@automovie/engine";
import type {
  IAutoMovieProductionPngProfile,
  IAutoMovieResolveProductionPngProfileProps,
} from "@automovie/interface";

/*
 * Resolve one output role to the exact PNG profile its writer must emit.
 *
 * A `waveform` or `spectrogram` picture takes the fixed size the engine's
 * sound-evidence writers draw, and `width` and `height` are ignored for it. A
 * `preview` or `guide-frame` picture takes the authored raster passed in
 * `width` and `height`, in pixels. Every other profile field is the one literal
 * the writers support: 8-bit straight-alpha RGBA, sRGB, square, upright and not
 * interlaced. Throws when the resolved raster is not a positive safe-integer
 * size, which includes a preview or guide frame called without one.
 */
export const resolveProductionPngProfile: (
  props: IAutoMovieResolveProductionPngProfileProps,
) => IAutoMovieProductionPngProfile = (
  props: IAutoMovieResolveProductionPngProfileProps,
): IAutoMovieProductionPngProfile => {
  const raster: { width: number | undefined; height: number | undefined } =
    props.role === "waveform" || props.role === "spectrogram"
      ? AutoMovieEngineProductionSoundEvidenceRasters[props.role]
      : { width: props.width, height: props.height };
  const width: number | undefined = raster.width;
  const height: number | undefined = raster.height;
  if (width === undefined || height === undefined || width <= 0 || height <= 0)
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
