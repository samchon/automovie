/**
 * Return the existing mulberry32 draw closure for a seed coerced to unsigned
 * 32 bits. Each call advances its captured state with the same wrapping integer
 * operations and returns an unsigned 32-bit value divided by 2^32, in [0,1).
 *
 * Quaternion and ROM sweeps own their seed and draw order. This helper does not
 * use Math.random, share state between closures or certify statistical coverage
 * of a continuous population; replay depends on the unchanged seed and calls.
 */
export const makeRng: (seed: number) => () => number = (seed: number): (() => number) => {
  let a: number = seed >>> 0;
  return (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t: number = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
