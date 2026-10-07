/**
 * One place on the face skin, stated on the skin's own topology: a triangle of
 * the host surface and the barycentric weights of the point inside it.
 *
 * A seat is independent of coordinates, so the same seat names the same piece
 * of skin on the neutral, shaped and performed surface. Whatever is attached
 * to the skin (a brow root, a hair root, a relief course) keeps its seat and
 * reads its current position from the current skin.
 *
 * @evidence contracts/common.md#principled-implementation Barycentric weights over one triangle are the affine coordinates of a point of that triangle, so the same weights over the triangle's moved corners give the materially same skin point under any deformation that moves vertices.
 * @evidence contracts/common.md#clear-and-simple-design Two fields carry the whole attachment; no cached coordinate can go stale.
 * @evidence contracts/common.md#meaningful-documentation States what a seat identifies and why it holds across skin states.
 * @evidence contracts/modeling.md#spatial-conventions A seat carries no unit or frame: a triangle ordinal of the host surface's index list and three dimensionless weights that sum to one.
 * @evidence contracts/modeling.md#shared-boundaries The seat is the one definition an attached part and the skin share, so the part meets the skin at the same material point in every state.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinSeat {
  /** Ordinal of the host triangle in the surface's index list. */
  triangle: number;

  /** Barycentric weights of the triangle's three corners, summing to one. */
  weights: [number, number, number];
}
