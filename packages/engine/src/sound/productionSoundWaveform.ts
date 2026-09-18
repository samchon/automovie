import { IAutoMovieProductionSoundRaster } from "./IAutoMovieProductionSoundRaster";

/**
 * Draw sample extrema as deterministic waveform evidence.
 *
 * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Visualizes extrema measured from the exact final stereo samples.
 * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Produces deterministic waveform evidence for review.
 */
export const productionSoundWaveform = (
  pcm: Float32Array,
  width = 960,
  height = 240,
): IAutoMovieProductionSoundRaster => {
  assertRasterSize(width, height);
  if (pcm.length % 2 !== 0)
    throw new Error("Production waveform requires interleaved stereo PCM.");
  const rgba = rasterBackground(width, height);
  const frames = pcm.length / 2;
  const middle = Math.floor(height / 2);
  for (let x = 0; x < width; ++x) {
    const from = Math.floor((frames * x) / width);
    const to = Math.max(from + 1, Math.floor((frames * (x + 1)) / width));
    let amplitude = 0;
    for (let sample = from; sample < Math.min(to, frames); ++sample)
      amplitude = Math.max(
        amplitude,
        Math.abs(pcm[sample * 2]!),
        Math.abs(pcm[sample * 2 + 1]!),
      );
    const radius = Math.round(amplitude * (height / 2 - 2));
    for (let y = middle - radius; y <= middle + radius; ++y)
      setPixel(rgba, width, x, y, 75, 222, 190);
  }
  return { width, height, rgba };
};
