

/** Read the authored PNG framing to select input chunks for one explicitly malformed container variant. */
export const pngChunks = (
  bytes: Uint8Array,
): Array<{ type: string; data: Uint8Array }> => {
  const chunks: Array<{ type: string; data: Uint8Array }> = [];
  for (let cursor = 8; cursor < bytes.length; ) {
    const size = Buffer.from(bytes).readUInt32BE(cursor);
    chunks.push({
      type: Buffer.from(bytes.subarray(cursor + 4, cursor + 8)).toString(
        "ascii",
      ),
      data: bytes.subarray(cursor + 8, cursor + 8 + size),
    });
    cursor += 12 + size;
  }
  return chunks;
};
