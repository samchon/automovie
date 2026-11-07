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
