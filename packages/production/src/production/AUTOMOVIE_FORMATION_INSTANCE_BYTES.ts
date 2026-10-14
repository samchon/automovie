/**
 * Bytes for one float32 4x4 transform plus one float32 phase scalar per anonymous LOD instance.
 *
 * This retained admission policy or byte convention does not measure actual allocation or establish a universal hardware bound.
 *
 * @author Samchon
 */
export const AUTOMOVIE_FORMATION_INSTANCE_BYTES: number =
  16 * Float32Array.BYTES_PER_ELEMENT + Float32Array.BYTES_PER_ELEMENT;
