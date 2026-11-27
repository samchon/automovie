import type { AutoMovieProductionPngRole } from "./AutoMovieProductionPngRole";

/**
 * PNG output role and its optional authored raster. resolveProductionPngProfile
 * requires positive integral width/height for preview and guide-frame roles;
 * waveform and spectrogram use their fixed evidence rasters and ignore these
 * dimensions.
 */
export interface IAutoMovieResolveProductionPngProfileProps {
  /** Output role selecting an engine-fixed or caller-supplied raster. */
  role: AutoMovieProductionPngRole;

  /**
   * Pixel width required for preview/guide-frame and ignored for sound-evidence
   * roles.
   */
  width?: number;

  /**
   * Pixel height required for preview/guide-frame and ignored for
   * sound-evidence roles.
   */
  height?: number;
}
