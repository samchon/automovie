/**
 * Topology admission for a compiled oriented-distance query.
 *
 * An open sheet retains oriented interior features while reporting rim-feature
 * side as unknown. Both modes refuse multiply incident or inconsistently wound
 * edges; neither mode infers outward orientation or absence of self-crossing.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Makes the query's closed-surface or open-sheet precondition explicit to composing callers.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Selects the admitted boundary topology without closing, moving or changing input triangles.
 * @author Samchon
 */
export interface IAutoMovieSignedMeshQueryOptions {
  /** Omitted requires paired opposite edges; open admits single-incident rims. */
  boundary?: "closed" | "open";
}
