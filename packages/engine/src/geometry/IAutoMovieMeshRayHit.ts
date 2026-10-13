/**
 * An owned ray intersection in the snapshotted mesh's local metre frame,
 * returned by {@link IAutoMovieMeshRayCaster.nearestHit}.
 *
 * Triangle identity is the original index-triplet ordinal, before the caster's
 * hierarchy sorts its triangles; it identifies the face hit without certifying
 * which side the ray came from or that the origin is inside a volume.
 *
 * @evidence contracts/common.md#principled-implementation Both fields come from the caster's Moller-Trumbore traversal: `distance` is the accepted parameter along the normalized ray and `triangle` maps the hierarchy slot back through its ordinal table, with equal travel resolved to the lowest ordinal.
 * @evidence contracts/common.md#clear-and-simple-design Travel plus face identity is what hair exterior intervals and rooted stems read to attribute a hit; the hit point is not stored because a caller recovers it as origin plus travel times direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The ordinal is the caller's own index-buffer ordinal rather than the traversal slot, so excluding or attributing a face never depends on how the hierarchy happened to split.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the frame and unit, the ordinal's origin and tie rule, the preserved sign of zero, and what the identity does not certify.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A two-scalar record; the traversal that produces it is answered on the caster's `nearestHit`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Allocated fresh per query and never shared with later queries, so a caller may keep or change it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two numbers with no reference into the caster's snapshot, released with whatever holds the record.
 * @author Samchon
 */
export interface IAutoMovieMeshRayHit {
  /**
   * Metres along the normalized ray from the origin, inside the query's
   * [minimum, maximum] interval and keeping the computed sign of zero.
   */
  distance: number;

  /**
   * Original triangle ordinal in the caster's input index buffer; the lowest
   * ordinal wins among triangles hit at equal travel.
   */
  triangle: number;
}
