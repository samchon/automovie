/** The CRC-32 lookup table, built once when the module loads. */
const TABLE: Uint32Array = ((): Uint32Array => {
  const table: Uint32Array = new Uint32Array(256);
  for (let n: number = 0; n < 256; n++) {
    let c: number = n;
    for (let k: number = 0; k < 8; k++)
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/**
 * The CRC-32 a PNG chunk carries, over the chunk's type and data bytes.
 *
 * PNG's CRC is the ISO 3309 / ITU-T V.42 polynomial `0xedb88320` (reflected),
 * initial value and final XOR `0xffffffff`, which the PNG specification's
 * section 5.5 gives with this table method. The encoder writes it and the
 * decoder checks it, so both share this one implementation.
 */
export function crcAutoMoviePngChunk(bytes: Uint8Array): number {
  let crc: number = 0xffffffff;
  for (let index: number = 0; index < bytes.length; index++)
    crc = TABLE[(crc ^ bytes[index]!) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
