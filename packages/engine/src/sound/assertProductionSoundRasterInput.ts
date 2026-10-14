/**
 * Admit dimensions and finite interleaved stereo PCM before evidence drawing.
 *
 * @evidence contracts/common.md#principled-implementation Positive safe-integer dimensions define pixel indices, even PCM length defines complete stereo frames, and Number.isFinite rejects undefined spectral/peak arithmetic; typed-array allocation capacity remains the caller/platform storage limit.
 * @evidence contracts/common.md#clear-and-simple-design Waveform and spectrogram share one input boundary while owning their separate drawing laws; empty stereo PCM remains an admitted silent raster input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid samples throw by index rather than being replaced with silence, and large finite amplitudes remain available for bounded viewport drawing instead of being rewritten here.
 * @evidence contracts/common.md#meaningful-documentation States stereo shape, finite samples, positive pixel dimensions and thrown effects; no PCM provenance, sample-rate adoption or memory-budget success is inferred.
 * @evidence contracts/performance.md#efficient-algorithms N PCM values require one O(N) finite scan and constant extra storage before the drawer allocates or computes evidence pixels.
 * @evidence contracts/performance.md#reuse-equivalent-work One admission owner replaces both drawers' duplicated dimension/shape checks; mutable PCM requires scanning each request rather than trusting an earlier cached validation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The operation retains no input or output buffer and acquires no encoder/host handle; failure publishes no partially drawn raster.
 */
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
