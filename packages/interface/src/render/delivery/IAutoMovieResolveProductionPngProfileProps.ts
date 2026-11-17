import type { AutoMovieProductionPngRole } from "./AutoMovieProductionPngRole.js";

/**
 * PNG output role and its optional authored raster. resolveProductionPngProfile requires positive integral width/height for preview and guide-frame roles; waveform and spectrogram use their fixed evidence rasters and ignore these dimensions.
 *
 * @evidence contracts/development/design.md#principled-representation PNG output role and its optional authored raster. resolveProductionPngProfile requires positive integral width/height for preview and guide-frame roles; waveform and spectrogram use their fixed evidence rasters and ignore these dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface resolveProductionPngProfile exchanges role, width, height; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts PNG output role and its optional authored raster. resolveProductionPngProfile requires positive integral width/height for preview and guide-frame roles; waveform and spectrogram use their fixed evidence rasters and ignore these dimensions.
 * @evidence contracts/development/common.md#meaningful-documentation PNG output role and its optional authored raster. resolveProductionPngProfile requires positive integral width/height for preview and guide-frame roles; waveform and spectrogram use their fixed evidence rasters and ignore these dimensions. The prose and members document how resolveProductionPngProfile interprets and admits these values.
 */
export interface IAutoMovieResolveProductionPngProfileProps {
  /** Output role selecting an engine-fixed or caller-supplied raster. */
  role: AutoMovieProductionPngRole;

  /** Pixel width required for preview/guide-frame and ignored for sound-evidence roles. */
  width?: number;

  /** Pixel height required for preview/guide-frame and ignored for sound-evidence roles. */
  height?: number;
}
