

/** CRC-32 lookup generated from the PNG polynomial, used only to author independently valid input chunk checksums. */
export const CRC_TABLE: number[] = Array.from({ length: 256 }, (_: unknown, index: number): number => {
  let value: number = index;
  for (let bit: number = 0; bit < 8; bit++)
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
