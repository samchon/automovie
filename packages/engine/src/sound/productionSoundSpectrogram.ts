import { IAutoMovieProductionSoundRaster } from "./IAutoMovieProductionSoundRaster";

/**
 * Draw a fixed-window log-magnitude spectrogram from exact mixed PCM.
 *
 * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Visualizes fixed-window spectral measurements from final PCM.
 * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Produces deterministic spectrogram evidence for review.
 */
export const productionSoundSpectrogram = (
  pcm: Float32Array,
  width = 512,
  height = 192,
): IAutoMovieProductionSoundRaster => {
  assertRasterSize(width, height);
  if (pcm.length % 2 !== 0)
    throw new Error("Production spectrogram requires interleaved stereo PCM.");
  const rgba = new Uint8Array(width * height * 4);
  const frames = pcm.length / 2;
  const windowSize = 256;
  for (let x = 0; x < width; ++x) {
    const center = Math.floor((frames * x) / width);
    for (let y = 0; y < height; ++y) {
      const bin = 1 + Math.floor(((height - 1 - y) * 127) / height);
      let real = 0;
      let imaginary = 0;
      for (let offset = 0; offset < windowSize; ++offset) {
        const sample = center + offset - windowSize / 2;
        if (sample < 0 || sample >= frames) continue;
        const mono = (pcm[sample * 2]! + pcm[sample * 2 + 1]!) * 0.5;
        const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * offset) / 255);
        const phase = (2 * Math.PI * bin * offset) / windowSize;
        real += mono * window * Math.cos(phase);
        imaginary -= mono * window * Math.sin(phase);
      }
      const level = clamp(
        (20 * Math.log10(Math.hypot(real, imaginary) / 128 + 1e-7) + 100) / 100,
        0,
        1,
      );
      const red = Math.round(255 * level * level);
      const green = Math.round(255 * Math.sqrt(level));
      const blue = Math.round(180 * (1 - level) + 50 * level);
      setPixel(rgba, width, x, y, red, green, blue);
    }
  }
  return { width, height, rgba };
};

const assertRasterSize = (width: number, height: number): void => {
  if (
    Number.isSafeInteger(width) === false ||
    Number.isSafeInteger(height) === false ||
    width <= 0 ||
    height <= 0
  )
    throw new Error(
      "Sound evidence raster dimensions must be positive integers.",
    );
};

const setPixel = (
  rgba: Uint8Array,
  width: number,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
): void => {
  const index = (y * width + x) * 4;
  rgba[index] = red;
  rgba[index + 1] = green;
  rgba[index + 2] = blue;
  rgba[index + 3] = 255;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
