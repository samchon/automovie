

/**
 * Matrix bytes reserved by one slot in one LOD instance buffer.
 * This preserved public value counts sixteen float32 entries only. No maintained
 * internal consumer uses it to allocate buffers or certify total GPU retention.
 */
export const AUTOMOVIE_FORMATION_MATRIX_BYTES: number =
  16 * Float32Array.BYTES_PER_ELEMENT;
