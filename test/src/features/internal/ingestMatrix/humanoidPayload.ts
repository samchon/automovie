

/**
 * Encode one full unsigned-byte weight per vertex and zero-valued joint indices.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const humanoidPayload: () => Buffer = (): Buffer => {
  const payload: Buffer = Buffer.alloc(60);
  for (let vertex: number = 0; vertex < 3; ++vertex) payload[48 + vertex * 4] = 255;
  return payload;
};
