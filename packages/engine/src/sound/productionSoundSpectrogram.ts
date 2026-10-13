import { AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS } from "./AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS";
import { IAutoMovieProductionSoundRaster } from "./IAutoMovieProductionSoundRaster";
import { assertProductionSoundRasterInput } from "./assertProductionSoundRasterInput";
/**
 * Draw a fixed 256-sample Hann-window log-magnitude stereo spectrum.
 *
 * @evidence contracts/common.md#principled-implementation Each column centres one zero-padded stereo-mean window and direct DFT bins 1..127, scales magnitude by128, then maps the declared -100dB display range to RGB. PCM is finite and unchanged during the call; this fixed-bin visualization is not a frequency-estimation or provenance certificate.
 * @evidence contracts/common.md#clear-and-simple-design The drawer owns its window/bin/palette law, and shared admission owns stereo/dimensions/finiteness; identical row bins reuse their column result without introducing an FFT or cross-request cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-finite PCM throws, out-of-source window samples are declared zero padding, and the 1e-7 floor belongs to display contrast; no pixel or PCM is adjusted for a fixture. Repository production raster consumption remains unwired.
 * @evidence contracts/common.md#meaningful-documentation States 256 samples, Hann denominator255, stereo mean, positive bins and logarithmic palette; sample-rate interpretation belongs to the caller and transcendental rounding is not a cross-host byte guarantee.
 * @evidence contracts/performance.md#efficient-algorithms N input samples and W by H pixels cost O(N+W*256*min(H,127)+WH), with 4WH result bytes and at most min(H,127) scalar levels live for one column; each distinct bin keeps the original summation order.
 * @evidence contracts/performance.md#reuse-equivalent-work One computed log level is shared by rows with the same bin and centre, under the fixed PCM generation premise; the map resets for each column and disappears after the call, so changed PCM cannot reuse an earlier request.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh RGBA buffer; per-column maps retain at most127 numeric entries, and allocation/error exit retains no audio, GPU, encoder or host task.
 */
export const productionSoundSpectrogram: (pcm: Float32Array<ArrayBufferLike>, width?: number, height?: number) => IAutoMovieProductionSoundRaster = (
  pcm: Float32Array,
  width: number = AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS.spectrogram.width,
  height: number = AUTOMOVIE_PRODUCTION_SOUND_EVIDENCE_RASTERS.spectrogram.height,
): IAutoMovieProductionSoundRaster => {
  assertProductionSoundRasterInput(pcm, width, height, "spectrogram");
  const rgba: Uint8Array<ArrayBuffer> = new Uint8Array(width * height * 4);
  const frames: number = pcm.length / 2;
  const windowSize: number = 256;
  for (let x: number = 0; x < width; ++x) {
    const center: number = Math.floor((frames * x) / width);
    const levels: Map<number, number> = new Map();
    for (let y: number = 0; y < height; ++y) {
      const bin: number = 1 + Math.floor(((height - 1 - y) * 127) / height);
      let level: number | undefined = levels.get(bin);
      if (level === undefined) {
        let real: number = 0;
        let imaginary: number = 0;
        for (let offset: number = 0; offset < windowSize; ++offset) {
          const sample: number = center + offset - windowSize / 2;
          if (sample < 0 || sample >= frames) continue;
          const mono: number = (pcm[sample * 2]! + pcm[sample * 2 + 1]!) * 0.5;
          const window: number = 0.5 - 0.5 * Math.cos((2 * Math.PI * offset) / 255);
          const phase: number = (2 * Math.PI * bin * offset) / windowSize;
          real += mono * window * Math.cos(phase);
          imaginary -= mono * window * Math.sin(phase);
        }
        level = clamp((20 * Math.log10(Math.hypot(real, imaginary) / 128 + 1e-7) + 100) / 100, 0, 1);
        levels.set(bin, level);
      }
      const red: number = Math.round(255 * level * level);
      const green: number = Math.round(255 * Math.sqrt(level));
      const blue: number = Math.round(180 * (1 - level) + 50 * level);
      setPixel(rgba, width, x, y, red, green, blue);
    }
  }
  return { width, height, rgba };
};

/** Write one row-major opaque RGBA pixel at the loop's admitted coordinates using the bounded level palette. */
const setPixel: (rgba: Uint8Array<ArrayBufferLike>, width: number, x: number, y: number, red: number, green: number, blue: number) => void = (
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

/** Bound the fixed-window logarithmic display level to [0,1]; this maps display contrast without changing the supplied PCM. */
const clamp: (value: number, minimum: number, maximum: number) => number = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
