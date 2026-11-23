/**
 * Query-local selection of original triangles that are not ray targets.
 *
 * An attachment owner excludes the faces incident to its attachment vertex by
 * topology instead of moving the origin or skipping a band of near travel, as
 * body layer surfaces do for each vertex they cast from. Every ordinal must be
 * a safe integer addressing the caster's original triangles, and the query
 * throws before traversal otherwise. Exclusions never alter the caster's
 * snapshot and imply no sidedness or containment result.
 */
export interface IAutoMovieMeshRayQueryOptions {
  /**
   * Original triangle ordinals this query ignores. Omitted means every triangle
   * is a target; an empty set means the same.
   */
  excludedTriangles?: ReadonlySet<number>;
}
