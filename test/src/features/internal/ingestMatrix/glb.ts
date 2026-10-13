

/**
 * Encode specification-framed JSON/BIN chunks with independent little-endian header fields.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const glb: (document: unknown, bin: Buffer | null) => Buffer = (document: unknown, bin: Buffer | null): Buffer => {
  const source: Buffer = Buffer.from(JSON.stringify(document), "utf8");
  const jsonPadding: number = (4 - (source.length % 4)) % 4;
  const json: Buffer = Buffer.concat([source, Buffer.alloc(jsonPadding, 0x20)]);
  const total: number = 20 + json.length + (bin === null ? 0 : 8 + bin.length);
  const output: Buffer = Buffer.alloc(total);
  output.writeUInt32LE(0x46546c67, 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(total, 8);
  output.writeUInt32LE(json.length, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  json.copy(output, 20);
  if (bin !== null) {
    output.writeUInt32LE(bin.length, 20 + json.length);
    output.writeUInt32LE(0x004e4942, 24 + json.length);
    bin.copy(output, 28 + json.length);
  }
  return output;
};
