/**
 * One point in an oriented parent triangle's ordered two-coordinate chart.
 * Coordinates [u,v] mean corner0+u*(corner1-corner0)+v*(corner2-corner0),
 * with finite u,v >= 0 and u+v <= 1. The third weight stays implicit rather
 * than a stored triple whose floating sum must be repaired, and every consumer
 * evaluates it with interpolateHumanBasisSourceTriangle.
 *
 * The enclosing record owns the parent triangle table and the point order:
 * a source partition's refinements address its parentTriangles, and a face
 * pose plan's samples address its nativeTriangles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBasisSourceChartPoint {
  /** Ordinal of the oriented parent triangle in the enclosing record's table. */
  readonly parent: number;

  /** Dimensionless [u,v] chart coordinates over that parent's ordered corners. */
  readonly coordinates: readonly [number, number];
}
