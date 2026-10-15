/**
 * Read a profile given as keys at a position by smooth interpolation between neighbouring keys.
 *
 * Between two keys the value follows the cubic smoothstep `3t² − 2t³`, so the profile has zero slope at every key: a key is a crest, a trough or a shoulder of the form, never a kink. Before the first key and after the last the end values hold.
 *
 * @param keys Pairs of position and value with strictly increasing positions, at least one
 * @param at Position to read
 * @returns The value there
 */
export function interpolateAutoMovieHumanFootProfile(
  keys: ReadonlyArray<readonly [number, number]>,
  at: number,
): number {
  const first: readonly [number, number] = keys[0]!;
  if (at <= first[0]) return first[1];
  for (let i: number = 1; i < keys.length; ++i) {
    const [b, vb]: readonly [number, number] = keys[i]!;
    if (at <= b) {
      const [a, va]: readonly [number, number] = keys[i - 1]!;
      const t: number = (at - a) / (b - a);
      return va + (vb - va) * t * t * (3 - 2 * t);
    }
  }
  return keys[keys.length - 1]![1];
}
