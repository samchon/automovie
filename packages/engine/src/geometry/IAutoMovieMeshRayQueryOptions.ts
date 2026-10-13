/**
 * A query-local selection of native triangles that are not ray targets.
 *
 * An attachment owner may exclude its incident faces by topology instead of
 * moving the origin or skipping a metric band. Ordinals address the caster's
 * original triangle population, are checked before traversal and never alter
 * its snapshot. Exclusions do not imply a sidedness or containment result.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshRayQueryOptions {
  /** Native triangle ordinals excluded from this query, or no exclusions. */
  excludedTriangles?: ReadonlySet<number>;
}
