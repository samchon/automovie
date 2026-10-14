import { utf8Bytes } from "./utf8Bytes";

/**
 * A deterministic 32-bit FNV-1a hash of a string.
 *
 * Used to place a semantic id in the mask palette. FNV-1a rather than the
 * digest above because a palette slot needs a fast, well-distributed integer
 * and not a cryptographic guarantee; the mask's collision handling, not the
 * hash, is what makes the palette exact.
 *
 * @evidence contracts/common.md#principled-implementation FNV-1a starts at 0x811c9dc5, XORs each UTF-8 byte and multiplies modulo 2^32 by 16777619 using shifts plus the original hash term. Palette probing, not hash collision freedom, establishes unique semantic colors.
 * @evidence contracts/common.md#clear-and-simple-design The fast palette-placement hash is separate from cryptographic render digests; utf8Bytes owns the shared string-to-byte convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The multiplier is the actual FNV prime for every string; the omitted original-hash addend was corrected, so rederived palette colors/digests change and consumers comparing current mask identity require new evidence. The verifier still checks a supplied mask's own complete payload rather than rederiving its colors.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish noncryptographic 32-bit palette placement from SHA identity; the test independently multiplies Buffer UTF-8 bytes with Math.imul.
 * @evidence contracts/performance.md#efficient-algorithms B bytes require O(B) constant arithmetic and O(B) encoded temporary storage; no collision search occurs in this function.
 * @evidence contracts/performance.md#reuse-equivalent-work Digest and palette owners share UTF-8 encoding, while the hash value is recomputed per semantic id without a persistent identity cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only one number escapes; the encoded bytes become collectable and no palette registry or native resource is retained.
 */
export const autoMovieRenderHash32: (text: string) => number = (
  text: string,
): number => {
  let hash: number = 0x811c9dc5;
  const bytes: number[] = utf8Bytes(text);
  for (const byte of bytes) {
    hash = (hash ^ byte) >>> 0;
    // hash * 16777619 without losing the high bits to float rounding.
    hash =
      (hash +
        ((hash << 1) >>> 0) +
        ((hash << 4) >>> 0) +
        ((hash << 7) >>> 0) +
        ((hash << 8) >>> 0) +
        ((hash << 24) >>> 0)) >>>
      0;
  }
  return hash >>> 0;
};
