/**
 * Encode a string as UTF-8 bytes without `TextEncoder`.
 *
 * `TextEncoder` is present in Node 22 and in every browser, but not in every
 * embedder the viewer is dropped into, and a digest that silently changes when
 * a polyfill differs is worse than a loop. Lone surrogates encode as U+FFFD,
 * which is what `TextEncoder` does, so an id carrying broken UTF-16 still
 * digests identically on both sides.
 *
 * @evidence contracts/common.md#principled-implementation Decode valid UTF-16 surrogate pairs into code points, replace lone surrogates with U+FFFD and emit canonical 1/2/3/4-byte UTF-8 sequences, matching Node Buffer/TextEncoder semantics for render hashes.
 * @evidence contracts/common.md#clear-and-simple-design One pure byte encoder supports synchronous SHA and FNV callers without depending on an embedder's TextEncoder availability or polyfill.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Replacement is the declared Unicode encoding rule, not a fixture fallback; no locale, id or host-specific path alters bytes.
 * @evidence contracts/common.md#meaningful-documentation Docs identify UTF-8, astral pairing and lone-surrogate replacement; the returned number array belongs to the caller.
 * @evidence contracts/performance.md#efficient-algorithms U UTF-16 units require O(U) traversal and O(B) output bytes with B at most three times U; no intermediate code-point array is retained.
 * @evidence contracts/performance.md#reuse-equivalent-work SHA and FNV share this encoding law, while each arbitrary string call creates fresh bytes rather than retaining a content cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned byte array escapes; no encoder instance, native buffer handle or asynchronous task is acquired.
 */
export const utf8Bytes: (text: string) => number[] = (text: string): number[] => {
  const bytes: number[] = [];
  for (let index: number = 0; index < text.length; ++index) {
    let point: number = text.charCodeAt(index);
    if (point >= 0xd800 && point <= 0xdbff) {
      const low: number = index + 1 < text.length ? text.charCodeAt(index + 1) : 0;
      if (low >= 0xdc00 && low <= 0xdfff) {
        point = 0x10000 + ((point - 0xd800) << 10) + (low - 0xdc00);
        ++index;
      } else point = 0xfffd;
    } else if (point >= 0xdc00 && point <= 0xdfff) point = 0xfffd;
    if (point < 0x80) bytes.push(point);
    else if (point < 0x800)
      bytes.push(0xc0 | (point >> 6), 0x80 | (point & 63));
    else if (point < 0x10000)
      bytes.push(
        0xe0 | (point >> 12),
        0x80 | ((point >> 6) & 63),
        0x80 | (point & 63),
      );
    else
      bytes.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 63),
        0x80 | ((point >> 6) & 63),
        0x80 | (point & 63),
      );
  }
  return bytes;
};
