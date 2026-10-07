import { HumanExactFraction as F } from "../../../common/measure/HumanExactFraction";
import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceSkinChartCoordinate } from "./IHumanFaceSkinChartCoordinate";
import type { IHumanFaceSkinChartTriangle } from "./IHumanFaceSkinChartTriangle";

/**
 * Solve one chart triangle's affine inverse without rounded coordinates.
 * Its determinant and corners belong to the fixed native source chart, so
 * two adjacent cells agree exactly on their shared edge's inverse point.
 * A reversed or vertical cell cannot supply this chart's oriented inverse.
 *
 * @evidence contracts/common.md#principled-implementation Cramer's rule on an exact nonzero oriented determinant yields the triangle's barycentric inverse.
 * @evidence contracts/common.md#clear-and-simple-design Owns the one chart-cell inverse used by domain and point transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No barycentric saturation, tolerance or preferred nearest face replaces the solve.
 * @evidence contracts/common.md#meaningful-documentation States exact source ownership and singular/fold refusal.
 * @evidence contracts/modeling.md#spatial-conventions Chart coefficients and returned barycentric weights are dimensionless.
 * @evidence contracts/modeling.md#shared-boundaries Shared chart corners retain the same inverse point on native edges.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Solves correspondence on an existing cell.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring control.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The brow assembly observes the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Performs geometry rather than clinical measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range The chart and contact owners admit source support.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal curve input.
 * @author Samchon
 */
export function readHumanFaceSkinChartWeights(
  triangle: IHumanFaceSkinChartTriangle,
  point: IHumanFaceSkinChartCoordinate,
): [IHumanExactFraction, IHumanExactFraction, IHumanExactFraction] {
  if (triangle.determinant.numerator <= 0n)
    throw new Error(
      "Skin source chart reaches a vertical or reversed native facet: " +
        triangle.ordinal,
    );
  const [a, b, c] = triangle.corners;
  const ux = F.subtract(b.x, a.x),
    uy = F.subtract(b.y, a.y),
    vx = F.subtract(c.x, a.x),
    vy = F.subtract(c.y, a.y),
    wx = F.subtract(point.x, a.x),
    wy = F.subtract(point.y, a.y);
  const s = F.divide(
      F.subtract(F.multiply(wx, vy), F.multiply(wy, vx)),
      triangle.determinant,
    ),
    t = F.divide(
      F.subtract(F.multiply(ux, wy), F.multiply(uy, wx)),
      triangle.determinant,
    );
  return [F.subtract(F.subtract(F.create(1n), s), t), s, t];
}
