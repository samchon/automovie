/**
 * Flat-array triangle mesh produced by tessellation: parallel `positions` /
 * `normals` (xyz triples) and triangle `indices`. This is the render-ready form
 * a renderer uploads to the GPU, and matches the shape of {@link IAutoMovieMesh}
 * (minus skinning).
 */
export interface ITessellation {
  /** Packed xyz vertex positions. */
  positions: number[];
  /** Packed xyz vertex normals parallel to {@link positions}. */
  normals: number[];
  /** Triangle indices into the packed vertex arrays. */
  indices: number[];
}
