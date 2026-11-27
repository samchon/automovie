import { hashFnv1a64Implementation } from "./hashFnv1a64Implementation";

/*
 * A 64-bit seed derived from a film seed and stable string ids, as sixteen
 * lowercase hexadecimal digits.
 *
 * The ids name what draws (a subject, a channel, a shot), never an ordinal, so
 * inserting or reordering unrelated content leaves every other stream's seed
 * unchanged. The seed is the 64-bit FNV-1a hash (hashFnv1a64Implementation)
 * of the UTF-8 bytes of the film seed and each id, each followed by a 0xff byte
 * that no UTF-8 text contains, so ["ab", "c"] and ["a", "bc"] differ. A derived
 * seed is reproducible identity, not a secret.
 * Parameter filmSeed: The production's own seed text.
 * Parameter ids: Stable ids of the drawing stream, outermost first.
 * Returns: The seed, `/^[0-9a-f]{16}$/`.
 */
export function deriveSeedValue(
  filmSeed: string,
  ...ids: string[]
): string {
  const encoder: TextEncoder = new TextEncoder();
  const bytes: number[] = [];
  for (const text of [filmSeed, ...ids])
    bytes.push(...encoder.encode(text), 0xff);
  return hashFnv1a64Implementation(bytes);
}
