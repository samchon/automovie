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
 * @evidence contracts/common.md#principled-implementation An ordered parent plus finite nonnegative u and v with u+v at most one defines an affine triangle preimage.
 * @evidence contracts/common.md#clear-and-simple-design Two stored coordinates keep the third weight implicit and identify its enclosing parent table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The chart is evaluated in canonical corner order rather than repairing a redundant weight triple.
 * @evidence contracts/common.md#meaningful-documentation Members give parent-table scope, dimensionless units and the closed-triangle domain.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The ordered triangle chart point has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The ordered triangle chart point schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The ordered triangle chart point declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBasisSourceChartPoint {
  /** Ordinal of the oriented parent triangle in the enclosing record's table. */
  readonly parent: number;

  /** Dimensionless [u,v] chart coordinates over that parent's ordered corners. */
  readonly coordinates: readonly [number, number];
}
