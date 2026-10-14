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
 * @evidence contracts/common.md#principled-implementation Exact rational cross determinants solve the fixed material triangle's affine inverse, giving [1-s-t,s,t] with shared-edge agreement; nonpositive stored determinant refuses and actual point containment belongs to the walker.
 * @evidence contracts/common.md#clear-and-simple-design One inverse reader is shared by chart location, native anchor checks and continuation rather than independently rounded barycentric equations in each caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometric tolerance or normalized anatomical offset changes the inverse; exact coefficients preserve represented source input, not extra measurement accuracy.
 * @evidence contracts/common.md#meaningful-documentation The comment states fixed-chart ownership, exact inverse/shared-edge meaning and refusal for vertical/reversed chart facets.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed corners require a constant number of rational operations; time/temporary bytes depend on numerator/denominator bit sizes, with no triangle-population scan.
 * @evidence contracts/performance.md#reuse-equivalent-work The facet's stored determinant and corners are reused directly; the walker caches each chord's endpoint equations, while this reader retains no point-result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only returned weights escape; rational temporaries are call-local and no chart, handle or task is retained by this function.
 *
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
  const [a, b, c]: readonly [
    IHumanFaceSkinChartCoordinate,
    IHumanFaceSkinChartCoordinate,
    IHumanFaceSkinChartCoordinate,
  ] = triangle.corners;
  const ux: IHumanExactFraction = F.subtract(b.x, a.x),
    uy: IHumanExactFraction = F.subtract(b.y, a.y),
    vx: IHumanExactFraction = F.subtract(c.x, a.x),
    vy: IHumanExactFraction = F.subtract(c.y, a.y),
    wx: IHumanExactFraction = F.subtract(point.x, a.x),
    wy: IHumanExactFraction = F.subtract(point.y, a.y);
  const s: IHumanExactFraction = F.divide(
      F.subtract(F.multiply(wx, vy), F.multiply(wy, vx)),
      triangle.determinant,
    ),
    t: IHumanExactFraction = F.divide(
      F.subtract(F.multiply(ux, wy), F.multiply(uy, wx)),
      triangle.determinant,
    );
  return [F.subtract(F.subtract(F.create(1n), s), t), s, t];
}
