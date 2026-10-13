import { utf8Bytes } from "./utf8Bytes";

/**
 * A deterministic 32-bit FNV-1a hash of a string.
 *
 * Used to place a semantic id in the mask palette. FNV-1a rather than the
 * digest above because a palette slot needs a fast, well-distributed integer
 * and not a cryptographic guarantee; the mask's collision handling, not the
 * hash, is what makes the palette exact.
 */
export const autoMovieRenderHash32 = (text: string): number => {
  let hash = 0x811c9dc5;
  const bytes = utf8Bytes(text);
  for (const byte of bytes) {
    hash = (hash ^ byte) >>> 0;
    // hash * 16777619 without losing the high bits to float rounding.
    hash =
      (((hash << 1) >>> 0) +
        ((hash << 4) >>> 0) +
        ((hash << 7) >>> 0) +
        ((hash << 8) >>> 0) +
        ((hash << 24) >>> 0)) >>>
      0;
  }
  return hash >>> 0;
};
