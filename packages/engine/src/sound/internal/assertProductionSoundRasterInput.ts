/*
 * Admit dimensions and finite interleaved stereo PCM before evidence drawing.
 */
export function assertProductionSoundRasterInput(
  pcm: Float32Array,
  width: number,
  height: number,
  source: string,
): void {
  if (width <= 0 || height <= 0)
    throw new Error(
      "Sound evidence raster dimensions must be positive integers.",
    );
  if (pcm.length % 2 !== 0)
    throw new Error(`Production ${source} requires interleaved stereo PCM.`);
}
