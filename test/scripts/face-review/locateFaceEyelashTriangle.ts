import type { IEyelashCard } from "./prepareEyelashBasis";

/**
 * Locate one UV point on a lash card for both surface position and metric.
 * The preparation reader supplies triangle UVs and metre positions. Barycentric
 * weights identify one affine patch; collinear UV triangles have no inverse.
 * The inherited 1e-9 UV roundoff margin admits shared edges from either side.
 * Null means the point is outside every nondegenerate patch. Inputs are owned
 * by the caller and remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Inverting the triangle's two-dimensional affine map produces barycentric weights. Collinear UV patches have zero determinant and are skipped; the inherited shared-edge rounding margin is unchanged.
 * @evidence contracts/common.md#clear-and-simple-design Position lifting and transverse scale share this single patch locator, so their edge and degenerate-UV decisions cannot diverge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission depends on the supplied UV point and triangles only; no fixture or consumer identity is inspected.
 * @evidence contracts/common.md#meaningful-documentation States the preparation consumers, coordinate units, collinear refusal, shared-edge margin and unchanged caller ownership.
 * @evidence contracts/modeling.md#spatial-conventions Inputs and barycentric weights are dimensionless; metre positions are carried unchanged for the two metric consumers.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This locator owns no part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no shape channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It selects a caller-owned triangle and emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It reads existing triangles without constructing a boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It contains no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range UV patch admission is not physiological admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It consumes internal preparation geometry and defines no authored body control.
 */
export function locateFaceEyelashTriangle(
  card: IEyelashCard,
  point: readonly [number, number],
): { triangle: IEyelashCard["triangles"][number]; weights: [number, number, number] } | null {
  for (const triangle of card.triangles) {
    const [a, b, c] = triangle.uv;
    const denominator = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    if (denominator === 0) continue;
    const u = ((b[1] - c[1]) * (point[0] - c[0]) + (c[0] - b[0]) * (point[1] - c[1])) / denominator;
    const v = ((c[1] - a[1]) * (point[0] - c[0]) + (a[0] - c[0]) * (point[1] - c[1])) / denominator;
    const epsilon = -1e-9;
    if (u < epsilon || v < epsilon || u + v > 1 - epsilon) continue;
    return { triangle, weights: [u, v, 1 - u - v] };
  }
  return null;
}
