/**
 * The Philox4x32-10 counter-based block function (Salmon, Moraes, Dror and
 * Shaw, "Parallel random numbers: as easy as 1, 2, 3", SC 2011; the Random123
 * reference). A 128-bit counter and a 64-bit key map to 128 statistically
 * independent bits by ten rounds of two 32 x 32 -> 64 multiplications with
 * the published multipliers 0xD2511F53 and 0xCD9E8D57 and the Weyl key bumps
 * 0x9E3779B9 and 0xBB67AE85. It is a bijection of the counter for each key,
 * so distinct counters never repeat a block, and it is pure: the block of a
 * counter depends on the counter and the key alone, never on call order.
 *
 * @param counter Four unsigned 32-bit counter words, least significant first.
 * @param key Two unsigned 32-bit key words.
 * @returns Four unsigned 32-bit output words.
 */
export function philoxAutoMovie4x32(
  counter: readonly [number, number, number, number],
  key: readonly [number, number],
): [number, number, number, number] {
  let [c0, c1, c2, c3]: [number, number, number, number] = [
    counter[0] >>> 0,
    counter[1] >>> 0,
    counter[2] >>> 0,
    counter[3] >>> 0,
  ];
  let k0: number = key[0] >>> 0;
  let k1: number = key[1] >>> 0;
  for (let round: number = 0; round < 10; round++) {
    if (round > 0) {
      k0 = (k0 + 0x9e3779b9) >>> 0;
      k1 = (k1 + 0xbb67ae85) >>> 0;
    }
    const [hi0, lo0]: [number, number] = multiply(0xd2511f53, c0);
    const [hi1, lo1]: [number, number] = multiply(0xcd9e8d57, c2);
    [c0, c1, c2, c3] = [(hi1 ^ c1 ^ k0) >>> 0, lo1, (hi0 ^ c3 ^ k1) >>> 0, lo0];
  }
  return [c0, c1, c2, c3];
}

/** The high and low 32-bit words of an exact 32 x 32 -> 64 unsigned product, by 16-bit limbs so no partial sum exceeds 2^53. */
function multiply(a: number, b: number): [number, number] {
  const al: number = a & 0xffff;
  const ah: number = a >>> 16;
  const bl: number = b & 0xffff;
  const bh: number = b >>> 16;
  const low: number = al * bl;
  const cross1: number = ah * bl;
  const cross2: number = al * bh;
  const carry: number = (low >>> 16) + (cross1 & 0xffff) + (cross2 & 0xffff);
  const high: number =
    (ah * bh + (cross1 >>> 16) + (cross2 >>> 16) + (carry >>> 16)) >>> 0;
  return [high, Math.imul(a, b) >>> 0];
}
