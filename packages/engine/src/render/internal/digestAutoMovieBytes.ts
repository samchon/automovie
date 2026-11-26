/**
 * SHA-256 (FIPS 180-4) of a byte sequence, as `sha256:` and lowercase
 * hexadecimal, in synchronous pure TypeScript.
 *
 * The engine runs in the viewer's browser bundle as well as in Node, so it
 * cannot reach `node:crypto`, and `SubtleCrypto` is asynchronous and absent
 * outside a secure context. The transform is therefore written out with 32-bit
 * integer arithmetic normalized by `>>> 0`, so every platform produces the
 * digest `createHash("sha256")` produces for the same bytes. Whole blocks are
 * read straight from the input; only the final one or two padded blocks are
 * copied.
 *
 * @param bytes The bytes to digest; only read.
 * @returns `sha256:` followed by 64 lowercase hexadecimal digits.
 */
export function digestAutoMovieBytes(bytes: Uint8Array): string {
  const state: Uint32Array = Uint32Array.from(INITIAL_STATE);
  const schedule: Uint32Array = new Uint32Array(64);
  const whole: number = Math.floor(bytes.length / 64);
  for (let block: number = 0; block < whole; ++block)
    compress(state, schedule, bytes, block * 64);

  // Padding: the 0x80 terminator, zeroes, and the 64-bit big-endian bit
  // length, in one block when the tail leaves room for nine bytes, else two.
  const tail: number = bytes.length - whole * 64;
  const padded: Uint8Array = new Uint8Array(tail + 9 <= 64 ? 64 : 128);
  padded.set(bytes.subarray(whole * 64));
  padded[tail] = 0x80;
  const bits: number = bytes.length * 8;
  const view: DataView = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bits / 0x100000000));
  view.setUint32(padded.length - 4, bits >>> 0);
  for (let offset: number = 0; offset < padded.length; offset += 64)
    compress(state, schedule, padded, offset);

  let hex: string = "sha256:";
  for (const word of state) hex += word.toString(16).padStart(8, "0");
  return hex;
}

/**
 * The first 32 bits of the fractional parts of the square roots of the first
 * eight primes.
 */
const INITIAL_STATE: readonly number[] = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
];

/**
 * The first 32 bits of the fractional parts of the cube roots of the first 64
 * primes.
 */
const ROUND_CONSTANTS: Uint32Array = Uint32Array.from([
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
]);

/** Rotate a 32-bit word right. */
function rotate(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

/**
 * Run the 64 SHA-256 rounds over the 64-byte block at `offset`, updating
 * `state`.
 */
const compress: (
  state: Uint32Array,
  schedule: Uint32Array,
  bytes: Uint8Array,
  offset: number,
) => void = (
  state: Uint32Array,
  schedule: Uint32Array,
  bytes: Uint8Array,
  offset: number,
): void => {
  for (let word: number = 0; word < 16; ++word) {
    const at: number = offset + word * 4;
    schedule[word] =
      (bytes[at]! << 24) |
      (bytes[at + 1]! << 16) |
      (bytes[at + 2]! << 8) |
      bytes[at + 3]!;
  }
  for (let word: number = 16; word < 64; ++word) {
    const previous: number = schedule[word - 15]!;
    const ahead: number = schedule[word - 2]!;
    const s0: number =
      rotate(previous, 7) ^ rotate(previous, 18) ^ (previous >>> 3);
    const s1: number = rotate(ahead, 17) ^ rotate(ahead, 19) ^ (ahead >>> 10);
    schedule[word] = schedule[word - 16]! + s0 + schedule[word - 7]! + s1;
  }
  let a: number = state[0]!;
  let b: number = state[1]!;
  let c: number = state[2]!;
  let d: number = state[3]!;
  let e: number = state[4]!;
  let f: number = state[5]!;
  let g: number = state[6]!;
  let h: number = state[7]!;
  for (let round: number = 0; round < 64; ++round) {
    const s1: number = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
    const choose: number = (e & f) ^ (~e & g);
    const temp1: number =
      (h + s1 + choose + ROUND_CONSTANTS[round]! + schedule[round]!) >>> 0;
    const s0: number = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22);
    const majority: number = (a & b) ^ (a & c) ^ (b & c);
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
  state[0] = state[0]! + a;
  state[1] = state[1]! + b;
  state[2] = state[2]! + c;
  state[3] = state[3]! + d;
  state[4] = state[4]! + e;
  state[5] = state[5]! + f;
  state[6] = state[6]! + g;
  state[7] = state[7]! + h;
};
