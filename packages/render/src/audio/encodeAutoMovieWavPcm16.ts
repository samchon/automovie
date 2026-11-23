/**
 * Encode two equally long normalized channels as a canonical 44-byte-header
 * RIFF/WAVE file of 16-bit little-endian PCM stereo. Each sample is
 * quantized by `round(x * 32767)` for nonnegative and `round(x * 32768)` for
 * negative amplitudes, the inverse of the 1/32768 decode scale up to
 * rounding; a nonfinite or out-of-range amplitude is refused rather than
 * clipped. Deterministic: equal channels give equal bytes.
 *
 * @param left Left channel, amplitudes in [-1, 1].
 * @param right Right channel, the same length.
 * @param sampleRate Samples per second, a positive safe integer.
 * @returns The file bytes.
 */
export function encodeAutoMovieWavPcm16(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
): Uint8Array {
  if (
    left.length === 0 ||
    left.length !== right.length ||
    left.length > (0xffffffff - 36) / 4 ||
    !Number.isSafeInteger(sampleRate) ||
    sampleRate <= 0
  )
    throw new Error("Invalid stereo PCM length or rate");
  const bytes: Uint8Array = new Uint8Array(44 + left.length * 4);
  const view: DataView = new DataView(bytes.buffer);
  const tag = (at: number, text: string): void => {
    for (let k: number = 0; k < text.length; k++)
      bytes[at + k] = text.charCodeAt(k);
  };
  tag(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  tag(36, "data");
  view.setUint32(40, left.length * 4, true);
  for (let k: number = 0; k < left.length; k++)
    for (let channel: number = 0; channel < 2; channel++) {
      const x: number = (channel === 0 ? left : right)[k]!;
      if (!Number.isFinite(x) || Math.abs(x) > 1)
        throw new Error(`PCM amplitude ${x} at frame ${k}, channel ${channel}`);
      view.setInt16(
        44 + 4 * k + 2 * channel,
        Math.round(x * (x < 0 ? 32768 : 32767)),
        true,
      );
    }
  return bytes;
}
