/**
 * One place on the face skin, stated on the skin's own topology: a triangle of
 * the host surface and the barycentric weights of the point inside it.
 *
 * A seat is independent of coordinates, so the same seat names the same piece
 * of skin on the neutral, shaped and performed surface. Whatever is attached
 * to the skin (a brow root, a hair root, a relief course) keeps its seat and
 * reads its current position from the current skin.
 *
 * @evidence contracts/common.md#principled-implementation Native triangle ordinal and barycentric weights identify the same topology point across neutral, shaped and performed coordinates; the current host evaluates its position and normals without changing seat identity.
 * @evidence contracts/common.md#clear-and-simple-design Three weights and one triangle separate persistent correspondence from physical frame results and avoid retaining a duplicate point as authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Seat identity comes from native incidence, with no consumer-specific head-axis projection; valid barycentrics and matching topology are producer/caller premises, not enforced by this interface.
 * @evidence contracts/common.md#meaningful-documentation The comment states triangle index-list ordinals, sum-one weights and persistent attachment meaning across skin states.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This topology record executes no nearest query or affine frame interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The seat carries reusable correspondence but owns no request coordination or invalidation cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Seat values are ordinary attachment data; the type acquires no retained resource or running task.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinSeat {
  /** Ordinal of the host triangle in the surface's index list. */
  triangle: number;

  /** Barycentric weights of the triangle's three corners, summing to one. */
  weights: [number, number, number];
}
