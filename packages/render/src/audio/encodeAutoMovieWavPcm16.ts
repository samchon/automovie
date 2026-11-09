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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Encode two equally long normalized channels as a canonical 44-byte-header RIFF/WAVE file of 16-bit little-endian PCM stereo) and documents parameters `left`, `right`, `sampleRate`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Encode two equally long normalized channels as a canonical 44-byte-header RIFF/WAVE file of 16-bit little-endian PCM stereo) directly over its typed inputs (`left`, `right`, `sampleRate`) as nested iteration of depth 2 (for loop bounded by k < text.length; for loop bounded by k < left.length; for loop bounded by channel < 2), delegating to `Number.isSafeInteger`, `text.charCodeAt`, `tag`, `view.setUint32`, `view.setUint16`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 4294967295, 36, 4, 44, 8, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 41 lines and 19 top-level statements that reuses `Number.isSafeInteger`, `text.charCodeAt`, `tag`, `view.setUint32`, `view.setUint16` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `left`, `right`, `sampleRate`; the dominant cost is nested iteration of depth 2 (for loop bounded by k < text.length; for loop bounded by k < left.length; for loop bounded by channel < 2), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
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
