/**
 * Query-local selection of original triangles that are not ray targets.
 *
 * An attachment owner excludes the faces incident to its attachment vertex by
 * topology while retaining the original ray and travel interval. Supply safe
 * integer ordinals from the caster's original triangle population. Filtering
 * applies only to this query. Invalid ordinals throw before traversal.
 */
export interface IAutoMovieMeshRayQueryOptions {
  /**
   * Original triangle ordinals this query ignores. Omitted means every triangle
   * is a target; an empty set means the same.
   */
  excludedTriangles?: ReadonlySet<number>;
}
