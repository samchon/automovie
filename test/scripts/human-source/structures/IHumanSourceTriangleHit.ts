/**
 * The triangle point nearest to a query: the triangle id, the barycentric
 * weights of that point over the triangle's three corners in corner order,
 * and its distance in metres.
 *
 * @author Samchon
 */
export interface IHumanSourceTriangleHit {
  triangle: number;
  weights: number[];
  distance: number;
}
