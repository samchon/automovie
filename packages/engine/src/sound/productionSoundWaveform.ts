import { AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS } from "./AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS";
import { IAutoMovieProductionSoundRaster } from "./IAutoMovieProductionSoundRaster";
import { assertProductionSoundRasterInput } from "./assertProductionSoundRasterInput";

/**
 * Draw stereo peak bars on a bounded opaque RGBA viewport.
 *
 * @evidence contracts/common.md#principled-implementation Each horizontal bin uses the maximum absolute stereo sample, mapped to a centre-symmetric radius by the original display scale. Tiny canvases use zero available half-height and row endpoints clip to the admitted viewport; PCM itself is unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Shared raster admission owns finite stereo/dimensions, while this drawer owns peak bins, background and bounded pixel writes; its repository consumers remain tests rather than a PNG or film-runtime host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-finite samples throw instead of becoming silent evidence. Large finite peaks saturate only the pixel viewport, and empty PCM draws the existing centreline rather than inventing audio samples.
 * @evidence contracts/common.md#meaningful-documentation States interleaved stereo, arbitrary finite amplitude, positive pixel dimensions, tiny-height centreline and fresh RGBA ownership; byte drawing is not PCM provenance or delivered evidence adoption.
 * @evidence contracts/performance.md#efficient-algorithms N PCM values plus W by H pixels take O(N+WH) admission/bin/background/bounded-bar work and 4WH output bytes; no peak can induce traversal outside those H rows.
 * @evidence contracts/performance.md#reuse-equivalent-work One peak and radius serve each column, while the shared admission owner prevents divergent dimension/shape policies; changed PCM or dimensions are redrawn without a retained result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh raster buffer, temporaries are scalar and allocation failure propagates; no audio, encoder, GPU or host resource is retained.
 */
export const productionSoundWaveform: (
  pcm: Float32Array<ArrayBufferLike>,
  width?: number,
  height?: number,
) => IAutoMovieProductionSoundRaster = (
  pcm: Float32Array,
  width: number = AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS.waveform.width,
  height: number = AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS.waveform.height,
): IAutoMovieProductionSoundRaster => {
  assertProductionSoundRasterInput(pcm, width, height, "waveform");
  const rgba: Uint8Array<ArrayBufferLike> = rasterBackground(width, height);
  const frames: number = pcm.length / 2;
  const middle: number = Math.floor(height / 2);
  for (let x: number = 0; x < width; ++x) {
    const from: number = Math.floor((frames * x) / width);
    const to: number = Math.max(
      from + 1,
      Math.floor((frames * (x + 1)) / width),
    );
    let amplitude: number = 0;
    for (let sample: number = from; sample < Math.min(to, frames); ++sample)
      amplitude = Math.max(
        amplitude,
        Math.abs(pcm[sample * 2]!),
        Math.abs(pcm[sample * 2 + 1]!),
      );
    const radius: number = Math.round(amplitude * Math.max(0, height / 2 - 2));
    for (
      let y: number = Math.max(0, middle - radius);
      y <= Math.min(height - 1, middle + radius);
      ++y
    )
      setPixel(rgba, width, x, y, 75, 222, 190);
  }
  return { width, height, rgba };
};

/** Allocate a fresh opaque dark RGBA canvas; allocation failure propagates before any raster is published. */
const rasterBackground: (
  width: number,
  height: number,
) => Uint8Array<ArrayBufferLike> = (
  width: number,
  height: number,
): Uint8Array => {
  const rgba: Uint8Array<ArrayBuffer> = new Uint8Array(width * height * 4);
  for (let index: number = 0; index < rgba.length; index += 4) {
    rgba[index] = 8;
    rgba[index + 1] = 15;
    rgba[index + 2] = 28;
    rgba[index + 3] = 255;
  }
  return rgba;
};

/** Write one admitted in-viewport row-major pixel with the drawer's bounded byte palette; this private writer performs no independent coordinate admission. */
const setPixel: (
  rgba: Uint8Array<ArrayBufferLike>,
  width: number,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
) => void = (
  rgba: Uint8Array,
  width: number,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
): void => {
  const index: number = (y * width + x) * 4;
  rgba[index] = red;
  rgba[index + 1] = green;
  rgba[index + 2] = blue;
  rgba[index + 3] = 255;
};
