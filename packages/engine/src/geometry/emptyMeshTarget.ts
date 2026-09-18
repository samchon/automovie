/**
 * Allocates independently owned mesh attributes for procedural construction.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Allocates independently owned mesh attributes for procedural construction.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Starts a flat surface with empty position, normal, UV and triangle buffers.
 */
export const emptyMeshTarget = (): IMeshTarget => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
});
