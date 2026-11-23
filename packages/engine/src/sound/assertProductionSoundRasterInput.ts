/** Admit dimensions and finite interleaved stereo PCM before evidence drawing. */
export function assertProductionSoundRasterInput(
  pcm: Float32Array,
  width: number,
  height: number,
  source: string,
): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error(
      "Sound evidence raster dimensions must be positive integers.",
    );
  if (pcm.length % 2 !== 0)
    throw new Error(`Production ${source} requires interleaved stereo PCM.`);
  for (let index: number = 0; index < pcm.length; ++index)
    if (!Number.isFinite(pcm[index]))
      throw new Error(
        `Production ${source} requires finite PCM samples; invalid index ${index}.`,
      );
}
