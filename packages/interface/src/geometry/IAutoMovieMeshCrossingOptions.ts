/**
 * Population and contact classification for the mesh triangle crossing census
 * `measureAutoMovieMeshCrossings`.
 *
 * A transverse point is supplied only after the strict edge/triangle predicate
 * admits it. Rejecting that point continues through the remaining edges and
 * candidate triangles; it never exempts the whole triangle pair. Coplanar
 * overlap has no transverse point and keeps its separate report.
 *
 * @evidence contracts/development/design.md#principled-representation The callback receives each strict intersection point in the shared frame, and because a triangle intersection segment is straight, a classifier over its endpoint witnesses can decide whole-segment membership in a convex insertion region without the census knowing that region.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three optional knobs, pair population, interior margin and point classification, each read directly by the census loop; `IHumanFaceClearanceRequest` forwards the callback type rather than redeclaring it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The callback can only reject points the strict predicate already reported, so it cannot certify a crossing, and a rejection removes that one witness rather than the triangle pair.
 * @evidence contracts/development/common.md#meaningful-documentation States each option's omitted default, the tolerance's dimensionless range, the callback's frame, ordinal space and no-mutation rule, and that coplanar overlap bypasses the callback.
 */
export interface IAutoMovieMeshCrossingOptions {
  /** Retain every crossing pair; omitted reports one pair per first triangle. */
  allPairs?: boolean;

  /**
   * Dimensionless interior margin in segment and triangle coordinates, in
   * [0, 0.5), that classifies near-boundary residues as contact; omitted is
   * zero and a value outside the range throws.
   */
  interiorTolerance?: number;

  /**
   * Return true to count this transverse intersection, given in the meshes'
   * shared frame with the first and second triangle ordinals of the original
   * index buffers. The callback must not mutate geometry. Omitted counts every
   * strict intersection. The connected face and lash clearance readers use it
   * to classify individual insertion witnesses without exempting a pair.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A predicate over one strict intersection point and its triangle pair, consulted only after the census's own determinant test admitted the point, so classification can narrow the census but never widen it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A plain callback the census calls inline per witness, which lets the face readers bring their own insertion region without the census knowing anatomy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Returning false drops only that witness, so a caller cannot exempt a whole triangle pair, and the census does not reinterpret the answer.
   * @evidence contracts/development/common.md#meaningful-documentation States the point's frame, the ordinal space of both triangle arguments, the no-mutation rule, the omitted default, and who uses it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A caller-supplied predicate; its cost per strict witness is the caller's and is counted in the census's per-candidate work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The census calls it once per strict witness and caches no answer, since each point differs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The census holds the callback only for the duration of one query and retains no point it passed.
   */
  acceptTransversePoint?: (
    point: readonly number[],
    triangle: number,
    other: number,
  ) => boolean;
}
