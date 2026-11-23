/** Row-major opaque RGBA bytes produced by the waveform or spectrogram drawer. */
export interface IAutoMovieProductionSoundRaster {
  /** Raster width in pixels. */
  width: number;

  /** Raster height in pixels. */
  height: number;

  /**
   * Fresh row-major RGBA bytes, four channels per pixel; caller-owned and
   * mutable.
   */
  rgba: Uint8Array;
}
