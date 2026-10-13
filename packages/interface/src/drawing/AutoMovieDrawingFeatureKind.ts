/**
 * Family of geometric feature an annotation target addresses, and the world
 * point each one resolves to.
 *
 * - `vertex`: one welded world vertex.
 * - `edge`: the midpoint of one welded undirected edge.
 * - `face`: the centroid of one triangle.
 * - `axis`: the element's origin, carrying its local X, Y or Z direction.
 * - `centroid`: the mean of the element's welded vertices, which is not its
 *   area or volume centroid.
 *
 * @evidence contracts/common.md#principled-implementation A closed set of the features `resolveAutoMovieDrawingFeature` can compute from triangulated geometry and the element matrix, each mapping to one deterministic point, with vertices welded at six decimals so coincident corners count once.
 * @evidence contracts/common.md#clear-and-simple-design Five literals with no per-kind payload, since the index and count on `IAutoMovieDrawingFeature` carry everything every kind needs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `centroid` is the plain vertex mean, a stated stand-in for a mass centre rather than a hidden one, and no kind resolves through a nearest-match fallback.
 * @evidence contracts/common.md#meaningful-documentation Lists the point each kind resolves to and the vertex-mean meaning of `centroid`.
 * @author Samchon
 */
export type AutoMovieDrawingFeatureKind =
  | "vertex"
  | "edge"
  | "face"
  | "axis"
  | "centroid";
