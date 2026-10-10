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
