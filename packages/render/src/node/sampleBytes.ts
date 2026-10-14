import type { Sample } from "mp4box";

/**
 * The payload of `sample` inside the MP4 `bytes` it was parsed from, as an
 * array mp4box's `addSample` accepts.
 *
 * When `bytes` is backed by an ordinary `ArrayBuffer` the result is a view of
 * the same memory, so nothing is copied and the view keeps that buffer
 * reachable for as long as the view is held. A `SharedArrayBuffer`-backed
 * input is copied into a new `ArrayBuffer`, because `addSample` is typed for
 * an `ArrayBuffer`-backed array. Throws `MP4 sample <n> lies outside its
 * source bytes.` when the sample's range does not fit inside `bytes`, so a
 * view never reads memory beyond the source.
 *
 * @evidence contracts/common.md#principled-implementation A typed-array view over the same buffer at the sample's offset and size is exactly the payload the parser located, and the `instanceof ArrayBuffer` test is the runtime fact that makes the view satisfy `addSample`'s parameter type without an assertion.
 * @evidence contracts/common.md#clear-and-simple-design Both lossless sample writers, `appendLosslessVideoClip` and the feature mux, read payloads the same way, so the buffer test and the copy fallback live in one function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type requirement is met by checking the buffer at run time and copying when it does not hold, not by casting, and an out-of-range sample is refused rather than clamped as `subarray` would.
 * @evidence contracts/common.md#meaningful-documentation The doc says which bytes are returned, when they are a view and when a copy, why the copy exists, that a view keeps the source buffer alive, and the out-of-range refusal.
 * @evidence contracts/performance.md#efficient-algorithms The common case is constant time and allocates only a view; the fallback copies the sample's own bytes once, which is the minimum to obtain an ArrayBuffer-backed array.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call addresses a different sample, and a view is cheaper to create than any cache lookup.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A returned view retains the whole source buffer until every holder drops it, including mp4box's sample record after `addSample`; a fallback copy retains only the sample's bytes; nothing else is held.
 */
export const sampleBytes: (bytes: Uint8Array, sample: Sample) => Uint8Array<ArrayBuffer> = (
  bytes: Uint8Array,
  sample: Sample,
): Uint8Array<ArrayBuffer> => {
  if (
    Number.isSafeInteger(sample.offset) === false ||
    Number.isSafeInteger(sample.size) === false ||
    sample.offset < 0 ||
    sample.size < 0 ||
    sample.offset + sample.size > bytes.byteLength
  )
    throw new Error(`MP4 sample ${sample.number} lies outside its source bytes.`);
  const buffer: ArrayBufferLike = bytes.buffer;
  return buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer, bytes.byteOffset + sample.offset, sample.size)
    : Uint8Array.from(
        bytes.subarray(sample.offset, sample.offset + sample.size),
      );
};
