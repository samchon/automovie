/**
 * Query-local selection of original triangles that are not ray targets.
 *
 * An attachment owner excludes the faces incident to its attachment vertex by
 * topology instead of moving the origin or skipping a band of near travel, as
 * body layer surfaces do for each vertex they cast from. Every ordinal must be
 * a safe integer addressing the caster's original triangles, and the query
 * throws before traversal otherwise. Exclusions never alter the caster's
 * snapshot and imply no sidedness or containment result.
 *
 * @evidence contracts/development/design.md#principled-representation A set of original ordinals checked once before traversal and consulted per candidate triangle through the hierarchy's ordinal table, so an excluded face is skipped exactly while every other face keeps the same intersection test.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One optional field on an options record, so a query without exclusions passes nothing and the three caster entry points share one signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Self-intersection is removed by naming the incident faces rather than offsetting the origin or raising the minimum travel, both of which would also hide a genuine nearby surface.
 * @evidence contracts/development/common.md#meaningful-documentation States the intended use and its caller, the admission rule and when it is checked, that the snapshot is untouched, and what exclusion does not imply.
 */
export interface IAutoMovieMeshRayQueryOptions {
  /**
   * Original triangle ordinals this query ignores. Omitted means every
   * triangle is a target; an empty set means the same.
   */
  excludedTriangles?: ReadonlySet<number>;
}
