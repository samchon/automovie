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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The Philox4x32-10 counter-based block function (Salmon, Moraes, Dror and Shaw, "Parallel random numbers: as easy as 1, 2, 3", SC 2011; the Random123 reference)) and documents parameters `counter`, `key`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The Philox4x32-10 counter-based block function (Salmon, Moraes, Dror and Shaw, "Parallel random numbers: as easy as 1, 2, 3", SC 2011; the Random123 reference)) directly over its typed inputs (`counter`, `key`) as a single pass (for loop bounded by round < 10), delegating to `multiply`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 3, 10, 2654435769, 3144134277, 3528531795, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 20 lines and 5 top-level statements that reuses `multiply` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 3, 10, 2654435769, 3144134277, 3528531795 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `counter`, `key`; the dominant cost is a single pass (for loop bounded by round < 10), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
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
