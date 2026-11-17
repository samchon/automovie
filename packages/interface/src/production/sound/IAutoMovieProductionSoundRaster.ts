/**
 * Row-major opaque RGBA bytes produced by the waveform or spectrogram drawer.
 *
 * @evidence contracts/development/design.md#principled-representation Raster dimensions index four byte channels per pixel; the drawers produce waveform extrema or a fixed-window log-magnitude spectrum, not an encoded PNG or proof of source provenance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Pixel data stays renderer-neutral and separate from any encoder, making the exact returned bytes inspectable without a browser or codec.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Raster production is actual CPU drawing, but repository consumers are tests only; this shape does not claim a PNG was emitted or evidence was adopted.
 * @evidence contracts/development/common.md#meaningful-documentation Documents width/height in pixels and fresh row-major RGBA ownership, with channels stored as bytes and alpha set to 255 by both drawers.
 */
export interface IAutoMovieProductionSoundRaster {
  /** Raster width in pixels. */
  width: number;

  /** Raster height in pixels. */
  height: number;

  /** Fresh row-major RGBA bytes, four channels per pixel; caller-owned and mutable. */
  rgba: Uint8Array;
}
