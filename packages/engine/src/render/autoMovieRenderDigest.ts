import { utf8Bytes } from "./utf8Bytes";

/**
 * SHA-256 over a UTF-8 string, in pure TypeScript.
 *
 * The engine cannot reach `node:crypto`: the viewer bundles the engine into a
 * browser, so a Node built-in here would break the one consumer that has to
 * agree with the capture path byte for byte. It also cannot reach
 * `SubtleCrypto`, which is asynchronous and unavailable outside a secure
 * context, and a digest that is sometimes a promise is a digest no synchronous
 * evidence path can use.
 *
 * So the transform is written out. It is the FIPS 180-4 algorithm with no
 * variation, which means the same bytes hash to the same digest as
 * `createHash("sha256")` does on the capture side, and the test suite proves
 * exactly that against Node's implementation rather than against a stored
 * expectation of this code's own output.
 *
 * Everything is 32-bit integer arithmetic with `>>> 0` normalization, so
 * endianness, word size, and floating-point behavior cannot make one platform
 * disagree with another.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Encode UTF-8 with lone-surrogate replacement, pad 512-bit blocks with the full bit length, and run SHA-256's 64-word schedule/rounds using normalized 32-bit arithmetic. Node oracle tests cover padding and Unicode boundaries.
 * @evidence contracts/common.md#clear-and-simple-design Synchronous pure TypeScript hashing serves both browser engine and capture identity paths without Node crypto or asynchronous secure-context dependencies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Round constants and padding are algorithm constants, not fixture answers; malformed UTF-16 follows UTF-8 replacement semantics rather than platform-specific byte guesses.
 * @evidence contracts/common.md#meaningful-documentation Docs identify lowercase sha256: output, byte encoding, synchronous portability and comparison with Node's independent digest implementation.
 * @evidence contracts/performance.md#efficient-algorithms B encoded bytes require O(B) encoding/padding and O(B) block work, with a reused fixed 64-word schedule; storage includes both byte arrays and padded blocks rather than a streaming-memory claim.
 * @evidence contracts/performance.md#reuse-equivalent-work One schedule buffer is reused across blocks within a call; equal content can be hashed by multiple owners but no cache is retained over arbitrary input strings.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bytes, padding, schedule and state are call-owned; only the digest string escapes, with no crypto handle, worker or background promise.
 */
export const autoMovieRenderDigest: (text: string) => string = (
  text: string,
): string => `sha256:${sha256Hex(utf8Bytes(text))}`;

const ROUND_CONSTANTS: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

const rotateRight: (value: number, bits: number) => number = (
  value: number,
  bits: number,
): number => ((value >>> bits) | (value << (32 - bits))) >>> 0;

/** Hash a byte sequence and return the lowercase hexadecimal digest. */
const sha256Hex: (bytes: readonly number[]) => string = (
  bytes: readonly number[],
): string => {
  const state: number[] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ];
  // Padding: the 0x80 terminator, zeroes, and a 64-bit big-endian bit length.
  // The block count is exactly what makes the 55/56-byte boundary the one this
  // routine has to get right, and the suite pins both sides of it.
  const blocks: number = Math.floor((bytes.length + 8) / 64) + 1;
  const padded: number[] = new Array<number>(blocks * 64).fill(0);
  for (let index: number = 0; index < bytes.length; ++index)
    padded[index] = bytes[index]!;
  padded[bytes.length] = 0x80;
  const bitLength: number = bytes.length * 8;
  // A JavaScript number holds the exact bit length of any string this engine
  // digests; the high word is written from the same value so the encoding is
  // the full 64-bit field the standard requires.
  const high: number = Math.floor(bitLength / 0x100000000);
  const low: number = bitLength >>> 0;
  for (let byte: number = 0; byte < 4; ++byte) {
    padded[padded.length - 8 + byte] = (high >>> ((3 - byte) * 8)) & 0xff;
    padded[padded.length - 4 + byte] = (low >>> ((3 - byte) * 8)) & 0xff;
  }

  const schedule: number[] = new Array<number>(64).fill(0);
  for (let block: number = 0; block < blocks; ++block) {
    const base: number = block * 64;
    for (let word: number = 0; word < 16; ++word)
      schedule[word] =
        ((padded[base + word * 4]! << 24) |
          (padded[base + word * 4 + 1]! << 16) |
          (padded[base + word * 4 + 2]! << 8) |
          padded[base + word * 4 + 3]!) >>>
        0;
    for (let word: number = 16; word < 64; ++word) {
      const previous: number = schedule[word - 15]!;
      const ahead: number = schedule[word - 2]!;
      const s0: number =
        (rotateRight(previous, 7) ^
          rotateRight(previous, 18) ^
          (previous >>> 3)) >>>
        0;
      const s1: number =
        (rotateRight(ahead, 17) ^ rotateRight(ahead, 19) ^ (ahead >>> 10)) >>>
        0;
      schedule[word] =
        (schedule[word - 16]! + s0 + schedule[word - 7]! + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h]: [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ] = state as [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    for (let round: number = 0; round < 64; ++round) {
      const s1: number =
        (rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)) >>> 0;
      const choose: number = ((e & f) ^ (~e & g)) >>> 0;
      const temp1: number =
        (h + s1 + choose + ROUND_CONSTANTS[round]! + schedule[round]!) >>> 0;
      const s0: number =
        (rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)) >>> 0;
      const majority: number = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2: number = (s0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    const round: number[] = [a, b, c, d, e, f, g, h];
    for (let index: number = 0; index < 8; ++index)
      state[index] = (state[index]! + round[index]!) >>> 0;
  }

  return state
    .map((word: number): string => word.toString(16).padStart(8, "0"))
    .join("");
};
