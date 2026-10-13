import { CRC_TABLE } from "./CRC_TABLE";

/** Compute the standard PNG CRC-32 from input bytes for parser-valid chunk construction. */
export const crc32 = (bytes: Uint8Array): number => {
  let value = 0xffffffff;
  for (const byte of bytes)
    value = CRC_TABLE[(value ^ byte) & 0xff]! ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};
