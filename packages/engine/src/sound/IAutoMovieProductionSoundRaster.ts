/**
 * Row-major opaque RGBA bytes produced by the waveform or spectrogram drawer.
 *
 * @evidence contracts/common.md#principled-implementation Raster dimensions index four byte channels per pixel; the drawers produce waveform extrema or a fixed-window log-magnitude spectrum, not an encoded PNG or proof of source provenance.
 * @evidence contracts/common.md#clear-and-simple-design Pixel data stays renderer-neutral and separate from any encoder, making the exact returned bytes inspectable without a browser or codec.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Raster production is actual CPU drawing, but repository consumers are tests only; this shape does not claim a PNG was emitted or evidence was adopted.
 * @evidence contracts/common.md#meaningful-documentation Documents width/height in pixels and fresh row-major RGBA ownership, with channels stored as bytes and alpha set to 255 by both drawers.
 * @evidence contracts/performance.md#efficient-algorithms A W by H result retains exactly 4WH bytes plus its wrapper; spectrogram evaluates each of at most min(H,127) frequency bins once per column, then maps the reused levels to pixels.
 * @evidence contracts/performance.md#reuse-equivalent-work The pixel buffer is reusable by consumers for this completed drawing; changed PCM or dimensions require a new drawing, and mutable bytes are not digest identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh Uint8Array until discarded or transferred to an encoder; dimensions and allocation capacity bound bytes, with no separate application budget or GPU handle here.
 * @author Samchon
 */
export interface IAutoMovieProductionSoundRaster {
  /** Raster width in pixels. */
  width: number;

  /** Raster height in pixels. */
  height: number;

  /** Fresh row-major RGBA bytes, four channels per pixel; caller-owned and mutable. */
  rgba: Uint8Array;
}
