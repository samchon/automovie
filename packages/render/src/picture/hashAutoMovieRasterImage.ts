import type { IAutoMovieRasterImage } from "./IAutoMovieRasterImage.js";

/** SHA-256 round constants, FIPS 180-4 section 4.2.2. */
const K: Uint32Array = Uint32Array.from([
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

/**
 * The content hash a capture records for a still: `sha256:` and 64 lowercase hex digits over the picture's width and height, each a big-endian 32-bit integer, followed by its red, green and blue bytes row by row.
 *
 * The hash covers the colours the PNG file stores and nothing of how they were compressed, so two stills with equal pixels hash alike whatever encoder wrote them, and a still decoded from its file hashes as it did when it was drawn. Alpha is left out because the file drops it. Equal hashes establish that nothing changed, not that the picture is right.
 *
 * SHA-256 is written out in TypeScript: `node:crypto` would tie the capture core to Node, and `SubtleCrypto` is absent from a page outside a secure context, while this runs in either.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the output form, the exact bytes hashed, why compression and alpha are excluded, what equality establishes, and why the digest is written out.
 * @evidence contracts/development/implementation.md#principled-implementation FIPS 180-4 SHA-256: 512-bit blocks, the 64-word message schedule, the round constants of section 4.2.2, and padding with a 0x80 byte and the 64-bit big-endian message length, all in unsigned 32-bit arithmetic.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Lay out the hashed bytes once, then one compression loop over the padded message.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The constants are the standard's; the size is part of the hashed bytes, so two pictures with the same bytes in different shapes differ.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the pixel count: one copy of the RGB bytes and 64 rounds per 64-byte block, with the schedule array reused across blocks.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each still is hashed once by the capture that records it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one padded copy of the hashed bytes for the call; only the digest string escapes.
 */
export function hashAutoMovieRasterImage(image: IAutoMovieRasterImage): string {
  const count: number = image.width * image.height;
  if (image.pixels.length !== count * 4)
    throw new Error("Raster pixels do not match its size");

  // The message: size, then RGB, then SHA-256 padding to a whole number of blocks.
  const length: number = 8 + count * 3;
  const blocks: number = Math.floor((length + 8) / 64) + 1;
  const message: Uint8Array = new Uint8Array(blocks * 64);
  const view: DataView = new DataView(message.buffer);
  view.setUint32(0, image.width);
  view.setUint32(4, image.height);
  for (let index: number = 0; index < count; index++) {
    message[8 + index * 3] = image.pixels[index * 4]!;
    message[9 + index * 3] = image.pixels[index * 4 + 1]!;
    message[10 + index * 3] = image.pixels[index * 4 + 2]!;
  }
  message[length] = 0x80;
  view.setUint32(message.length - 8, Math.floor((length * 8) / 0x100000000));
  view.setUint32(message.length - 4, (length * 8) >>> 0);

  // The compression function over every block.
  const state: Uint32Array = Uint32Array.from([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ]);
  const w: Uint32Array = new Uint32Array(64);
  for (let block: number = 0; block < blocks; block++) {
    for (let t: number = 0; t < 16; t++) w[t] = view.getUint32(block * 64 + t * 4);
    for (let t: number = 16; t < 64; t++) {
      const older: number = w[t - 15]!;
      const recent: number = w[t - 2]!;
      const s0: number = rotate(older, 7) ^ rotate(older, 18) ^ (older >>> 3);
      const s1: number =
        rotate(recent, 17) ^ rotate(recent, 19) ^ (recent >>> 10);
      w[t] = (w[t - 16]! + s0 + w[t - 7]! + s1) >>> 0;
    }
    let a: number = state[0]!;
    let b: number = state[1]!;
    let c: number = state[2]!;
    let d: number = state[3]!;
    let e: number = state[4]!;
    let f: number = state[5]!;
    let g: number = state[6]!;
    let h: number = state[7]!;
    for (let t: number = 0; t < 64; t++) {
      const t1: number =
        (h +
          (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) +
          ((e & f) ^ (~e & g)) +
          K[t]! +
          w[t]!) >>>
        0;
      const t2: number =
        ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) +
          ((a & b) ^ (a & c) ^ (b & c))) >>>
        0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    const round: number[] = [a, b, c, d, e, f, g, h];
    for (let index: number = 0; index < 8; index++)
      state[index] = (state[index]! + round[index]!) >>> 0;
  }
  return `sha256:${Array.from(state, (word: number): string => word.toString(16).padStart(8, "0")).join("")}`;
}

/** Rotate a 32-bit word right. */
function rotate(value: number, bits: number): number {
  return ((value >>> bits) | (value << (32 - bits))) >>> 0;
}
