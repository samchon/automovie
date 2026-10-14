/**
 * Fold one full safe-integer seed into a domain-separated 32-bit state.
 *
 * Both 32-bit words participate, so values separated by 2^32 remain distinct.
 * The function is pure and stable across effect, combat, formation, and
 * instance-set runtimes.
 *
 * @evidence contracts/common.md#principled-implementation Safe-integer seed halves enter a fixed unsigned-word avalanche with a domain salt; ECMAScript integer operations are deterministic, while finite output cannot promise collision freedom.
 * @evidence contracts/common.md#clear-and-simple-design Effects, combat, formation and instance placement share this fold so high seed words are not discarded by individual consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fixed integer constants define the same mixing function for every caller, without ambient randomness or fixture seed remapping.
 * @evidence contracts/common.md#meaningful-documentation States safe-integer premise, high-word participation, domain separation and stable unsigned output without an injectivity claim.
 * @evidence contracts/performance.md#efficient-algorithms Two integer multiplications and fixed shifts cost constant time, without constructing seed arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Seed halves are extracted once; folds retain no previous random-stream position across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar words and the unsigned result exist; no generator instance or entropy resource is retained.
 */
export const mixSeed: (seed: number, salt: number) => number = (
  seed: number,
  salt: number,
): number => {
  const integer: number = Math.trunc(seed);
  const low: number = integer >>> 0;
  const high: number = Math.floor(integer / 4_294_967_296) >>> 0;
  let value: number = (salt ^ low) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15) ^ high, 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
};
