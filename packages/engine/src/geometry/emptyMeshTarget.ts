/** The buffers a flat-shaded builder fills before it becomes a mesh. */
interface IMeshTarget {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

/**
 * Allocates independently owned mesh attributes for procedural construction.
 */
export const emptyMeshTarget = (): IMeshTarget => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
});
