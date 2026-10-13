/**
 * Family of geometric feature an annotation target addresses, and the world
 * point each one resolves to.
 *
 * - `vertex`: one world vertex, welded at six decimals.
 * - `edge`: the midpoint of one welded undirected edge, carrying its direction.
 * - `face`: the centroid of one triangle.
 * - `axis`: the element's origin, carrying its local X, Y or Z direction.
 * - `centroid`: the mean of the element's welded vertices, which is not its
 *   area or volume centroid.
 *
 * @evidence contracts/common.md#principled-implementation `resolveAutoMovieDrawingFeature` builds each family from the element's world triangles: vertices and edges are welded by six-decimal keys and sorted by coordinate, faces keep emission order, an axis transforms the unit basis vector through the world matrix, and the centroid averages the welded vertices.
 * @evidence contracts/common.md#clear-and-simple-design Five families cover the points a drafter pins to, and each resolves to one point plus an optional direction, so dimensions and notes share a single resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The vertex mean is named as such instead of being presented as a true centroid, and no family falls back to another when its index is out of range.
 * @evidence contracts/common.md#meaningful-documentation States the world point each family resolves to, the welding precision, which families carry a direction, and how the centroid differs from an area or volume centroid.
 * @author Samchon
 */
export type AutoMovieDrawingFeatureKind =
  | "vertex"
  | "edge"
  | "face"
  | "axis"
  | "centroid";
