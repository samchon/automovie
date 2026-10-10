/**
 * Where the chosen neutral source axis meets the native eye surface.
 *
 * The hit is the source-axis/native-triangle intersection, not a
 * maximum-projection vertex, a measured corneal apex or a lid margin. Its
 * barycentric weights are `(1 - u - v, u, v)` over the triangle's corners.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOpticalSupportAnterior {
  /** Native vertex IDs of the hit triangle's corners. */
  triangle: [number, number, number];

  /** Barycentric weight of the second corner. */
  u: number;

  /** Barycentric weight of the third corner. */
  v: number;
}
