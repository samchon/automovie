

/**
 * Encode one full unsigned-byte weight per vertex and zero-valued joint indices.
 */
export const humanoidPayload: () => Buffer = (): Buffer => {
  const payload: Buffer = Buffer.alloc(60);
  for (let vertex: number = 0; vertex < 3; ++vertex) payload[48 + vertex * 4] = 255;
  return payload;
};
