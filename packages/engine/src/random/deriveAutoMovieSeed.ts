import { hashAutoMovieFnv1a64 } from "./hashAutoMovieFnv1a64";

/**
 * A 64-bit seed derived from a film seed and stable string ids, as sixteen
 * lowercase hexadecimal digits.
 *
 * The ids name what draws (a subject, a channel, a shot), never an ordinal,
 * so inserting or reordering unrelated content leaves every other stream's
 * seed unchanged. The seed is the 64-bit FNV-1a hash
 * ({@link hashAutoMovieFnv1a64}) of the UTF-8 bytes of the film seed and each
 * id, each followed by a 0xff byte that no UTF-8 text contains, so
 * ["ab", "c"] and ["a", "bc"] differ. A derived seed is reproducible
 * identity, not a secret.
 *
 * @param filmSeed The production's own seed text.
 * @param ids Stable ids of the drawing stream, outermost first.
 * @returns The seed, `/^[0-9a-f]{16}$/`.
 */
export function deriveAutoMovieSeed(
  filmSeed: string,
  ...ids: string[]
): string {
  const encoder: TextEncoder = new TextEncoder();
  const bytes: number[] = [];
  for (const text of [filmSeed, ...ids])
    bytes.push(...encoder.encode(text), 0xff);
  return hashAutoMovieFnv1a64(bytes);
}
