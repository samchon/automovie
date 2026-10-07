/**
 * A query-local selection of native triangles that are not ray targets.
 *
 * An attachment owner may exclude its incident faces by topology instead of
 * moving the origin or skipping a metric band. Ordinals address the caster's
 * original triangle population, are checked before traversal and never alter
 * its snapshot. Exclusions do not imply a sidedness or containment result.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Expresses topology-owned self-hit selection without consumer-specific distances or changed mesh coordinates.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Keeps native triangle incidence explicit while retaining all unexcluded geometry and attributes.
 * @author Samchon
 */
export interface IAutoMovieMeshRayQueryOptions {
  /** Native triangle ordinals excluded from this query, or no exclusions. */
  excludedTriangles?: ReadonlySet<number>;
}
