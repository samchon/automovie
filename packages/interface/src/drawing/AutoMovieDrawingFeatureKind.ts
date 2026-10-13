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
 * @author Samchon
 */
export type AutoMovieDrawingFeatureKind =
  | "vertex"
  | "edge"
  | "face"
  | "axis"
  | "centroid";
