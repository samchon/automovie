/** The CRC-32 lookup table, built on first use and shared by every call. */
let table: Uint32Array | undefined;

/**
 * The CRC-32 a PNG chunk carries, over the chunk's type and data bytes.
 *
 * PNG's CRC is the ISO 3309 / ITU-T V.42 polynomial `0xedb88320` (reflected), initial value and final XOR `0xffffffff`, which the PNG specification's section 5.5 gives with this table method. The encoder writes it and the decoder checks it, so both share this one implementation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the polynomial, its initial and final values, the bytes it covers and its two consumers.
 * @evidence contracts/development/implementation.md#principled-implementation The table-driven CRC of the PNG specification's sample code, with every step normalised to an unsigned 32-bit integer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the table once, then one loop over the bytes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The polynomial and the initial and final values are the specification's constants.
 * @evidence contracts/development/implementation.md#efficient-algorithms One table lookup per byte; the 256-entry table is built once per process.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The table is shared by every chunk and call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the 1 KiB table for the life of the process; the bytes are read, not kept.
 */
export function crcAutoMoviePngChunk(bytes: Uint8Array): number {
  if (table === undefined) {
    table = new Uint32Array(256);
    for (let n: number = 0; n < 256; n++) {
      let c: number = n;
      for (let k: number = 0; k < 8; k++)
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc: number = 0xffffffff;
  for (let index: number = 0; index < bytes.length; index++)
    crc = table[(crc ^ bytes[index]!) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
