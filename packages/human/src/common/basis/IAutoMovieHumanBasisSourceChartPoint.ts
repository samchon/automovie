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
 * @evidence contracts/common.md#principled-implementation Two independent affine coordinates define the point's partition of unity without a redundant sum constraint.
 * @evidence contracts/common.md#clear-and-simple-design One named parent-and-chart row replaces the identical anonymous rows of source refinements and face refinement replay.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The row stores a triangle ordinal and chart weights, never person coordinates or an exceptional vertex index.
 * @evidence contracts/common.md#meaningful-documentation States corner order, the chart formula and domain, the implicit weight and which table the parent addresses.
 * @evidence contracts/modeling.md#shared-boundaries Every consumer of a shared refinement evaluates the same ordered parent chart after performance.
 * @evidence contracts/modeling.md#spatial-conventions The parent is a dimensionless ordinal and u, v are dimensionless; evaluated components keep the consumer's metre frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A chart point defines no part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels Compiled chart coordinates are not person-authoring channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The row names a sample of an existing source; its compiler owns emission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The row displays nothing; its compiler and consuming assembly observe geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A chart coordinate is no anatomical value or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range The closed chart triangle is not a physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Offline correspondence introduces no person-authoring vertex input.
 * @author Samchon
 */
export interface IAutoMovieHumanBasisSourceChartPoint {
  /** Ordinal of the oriented parent triangle in the enclosing record's table. */
  readonly parent: number;

  /** Dimensionless [u,v] chart coordinates over that parent's ordered corners. */
  readonly coordinates: readonly [number, number];
}
