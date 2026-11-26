/**
 * Fold one full safe-integer seed into a domain-separated 32-bit state.
 *
 * Both 32-bit words participate, so values separated by 2^32 remain distinct.
 * The function is pure and stable across effect, combat, formation, and
 * instance-set runtimes.
 */
export function mixSeed(seed: number, salt: number): number {
  const integer: number = Math.trunc(seed);
  const low: number = integer >>> 0;
  const high: number = Math.floor(integer / 4_294_967_296) >>> 0;
  let value: number = (salt ^ low) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15) ^ high, 0x846ca68b);
  return (value ^ (value >>> 16)) >>> 0;
}
