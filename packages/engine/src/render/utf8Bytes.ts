/**
 * Encode a string as UTF-8 bytes without `TextEncoder`.
 *
 * `TextEncoder` is present in Node 22 and in every browser, but not in every
 * embedder the viewer is dropped into, and a digest that silently changes when
 * a polyfill differs is worse than a loop. Lone surrogates encode as U+FFFD,
 * which is what `TextEncoder` does, so an id carrying broken UTF-16 still
 * digests identically on both sides.
 *
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-canonical-fingerprint Canonicalizes JavaScript strings to the exact UTF-8 bytes consumed by render fingerprints.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Keeps the digest input encoding identical in browser and capture runtimes.
 */
export const utf8Bytes = (text: string): number[] => {
  const bytes: number[] = [];
  for (let index = 0; index < text.length; ++index) {
    let point = text.charCodeAt(index);
    if (point >= 0xd800 && point <= 0xdbff) {
      const low = index + 1 < text.length ? text.charCodeAt(index + 1) : 0;
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
