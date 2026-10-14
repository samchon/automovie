/**
 * Where the chosen neutral source axis meets the native eye surface.
 *
 * The hit is the source-axis/native-triangle intersection, not a
 * maximum-projection vertex, a measured corneal apex or a lid margin. Its
 * barycentric weights are `(1 - u - v, u, v)` over the triangle's corners.
 *
 * @evidence contracts/common.md#principled-implementation An oriented native triangle and its two barycentric coordinates retain the producer's exact source-axis intersection while current geometry supplies the transported point.
 * @evidence contracts/common.md#clear-and-simple-design The containing OpticalSupport owns source/generation/axis; this primitive owns only native corners and seat coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The frame resolver checks component membership, oriented incidence, finite nonnegative u/v and u+v <= 1 plus the source-line/facing premises; no maximum-projection fallback or measured corneal apex is invented.
 * @evidence contracts/common.md#meaningful-documentation Original corner IDs and (1-u-v,u,v) order distinguish this source seat from a free point or render-index UV coordinate.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The primitive performs no axis intersection or current interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Persisted source correspondence defines no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Three IDs and two numbers acquire no source geometry or query.
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
