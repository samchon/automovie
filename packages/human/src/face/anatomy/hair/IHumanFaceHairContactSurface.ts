/**
 * Fresh current hair-contact collider arrays. The closure producer appends centroid vertices and directed fan triangles without mutating the source arrays. The hair builder consumes this query-only surface; it is not displayed skin.
 *
 * @evidence contracts/common.md#principled-implementation Fresh positions plus directed closure-fan incidence represent a closed query collider while leaving source surface arrays unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Two mesh arrays form the query-only surface; displayed skin and closure construction remain distinct responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The contract identifies generated centroid caps explicitly rather than silently replacing visible skin or loading a hardcoded closed body.
 * @evidence contracts/common.md#meaningful-documentation The comment states current head-frame metres, appended centroids, original incidence and the non-display purpose of the collider.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This surface-result type does not select cap traversal; closeHumanFaceHairContact owns copying and processing each supplied boundary loop.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Fresh collider arrays describe the current closure result, with no declaration that a changed posed surface may reuse stale geometry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Position and index array lengths determine retained collider bytes; the hair builder owns their lifetime through its query instance.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactSurface {
  /** Current head-frame metre positions including closure centroids. */
  positions: number[];

  /** Original incidence followed by directed closure triangles. */
  indices: number[];
}
