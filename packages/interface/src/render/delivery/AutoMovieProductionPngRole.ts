/**
 * Role of a renderer-owned PNG, which decides its picture profile.
 *
 * `preview` and `guide-frame` pictures take the authored raster, while
 * `waveform` (960 × 240) and `spectrogram` (512 × 192) pictures have the fixed
 * rasters their audio-evidence writers draw; `resolveProductionPngProfile` maps
 * a role to its profile.
 */
export type AutoMovieProductionPngRole =
  | "preview"
  | "guide-frame"
  | "waveform"
  | "spectrogram";
