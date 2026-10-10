/**
 * One place on the face skin, stated on the skin's own topology: a triangle of
 * the host surface and the barycentric weights of the point inside it.
 *
 * A seat is independent of coordinates, so the same seat names the same piece
 * of skin on the neutral, shaped and performed surface. Whatever is attached
 * to the skin (a brow root, a hair root, a relief course) keeps its seat and
 * reads its current position from the current skin.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinSeat {
  /** Ordinal of the host triangle in the surface's index list. */
  triangle: number;

  /** Barycentric weights of the triangle's three corners, summing to one. */
  weights: [number, number, number];
}
