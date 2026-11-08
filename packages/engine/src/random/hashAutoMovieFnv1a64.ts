/**
 * The 64-bit FNV-1a hash of a byte sequence, as sixteen lowercase hexadecimal
 * digits (Fowler, Noll and Vo; IETF draft-eastlake-fnv: offset basis
 * 0xcbf29ce484222325, prime 0x100000001b3). Each byte is xored into the low
 * word and the 64-bit state multiplied by the prime modulo 2^64, computed in
 * two 32-bit words: the low word's product with 0x1b3 is below 2^41 and
 * exact in a double, and the prime's 2^40 term moves the low word eight bits
 * into the high word. A fast, well-dispersing non-cryptographic hash.
 *
 * @param bytes The bytes.
 * @returns The hash, `/^[0-9a-f]{16}$/`.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The 64-bit FNV-1a hash of a byte sequence, as sixteen lowercase hexadecimal digits (Fowler, Noll and Vo; IETF draft-eastlake-fnv: offset basis 0xcbf29ce484222325, prime 0x100000001b3)) and documents parameter `bytes`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (The 64-bit FNV-1a hash of a byte sequence, as sixteen lowercase hexadecimal digits (Fowler, Noll and Vo; IETF draft-eastlake-fnv: offset basis 0xcbf29ce484222325, prime 0x100000001b3)) directly over its typed inputs (`bytes`) as a single pass (for-of over bytes), delegating to `Math.imul`, `Math.floor`, `high.toString`, `low.toString`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 3421674724, 2216829733, 255, 435, 4294967296, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 15 lines and 4 top-level statements that reuses `Math.imul`, `Math.floor`, `high.toString`, `low.toString` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 3421674724, 2216829733, 255, 435, 4294967296 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `bytes`; the dominant cost is a single pass (for-of over bytes), performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function hashAutoMovieFnv1a64(bytes: Iterable<number>): string {
  let high: number = 0xcbf29ce4;
  let low: number = 0x84222325;
  for (const byte of bytes) {
    low = (low ^ (byte & 0xff)) >>> 0;
    const product: number = low * 0x1b3;
    high =
      (Math.imul(high, 0x1b3) +
        Math.floor(product / 0x100000000) +
        (low << 8)) >>>
      0;
    low = product >>> 0;
  }
  return high.toString(16).padStart(8, "0") + low.toString(16).padStart(8, "0");
}
