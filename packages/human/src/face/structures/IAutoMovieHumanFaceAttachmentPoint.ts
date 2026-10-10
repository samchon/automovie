/**
 * One material point on an actual host triangle, retained independently of
 * reference geometry. Coordinates are the triangle's ordered dimensionless
 * barycentric weights; the runtime reads its current corners.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAttachmentPoint {
  /** Triangle ordinal of the registered host index buffer. */
  triangle: number;

  /** Ordered weights for the host triangle's three original corners. */
  weights: number[];
}
