import { crc32 } from "./crc32";

/** Write one PNG chunk with big-endian length and independently computed CRC over its tag and payload. */
export function pngChunk(type: string, data: Uint8Array): Buffer {
  const length: Buffer = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body: Buffer = Buffer.concat([Buffer.from(type, "ascii"), Buffer.from(data)]);
  const crc: Buffer = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
