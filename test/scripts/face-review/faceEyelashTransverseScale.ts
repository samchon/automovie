import { locateFaceEyelashTriangle } from "./locateFaceEyelashTriangle";
import type { IEyelashCard } from "./prepareEyelashBasis";

/**
 * Metres of physical fibre width per unit of UV width normal to its UV path.
 *
 * Lash texture preparation uses this local scale to rasterize a diameter in
 * metres. Longitudinal UV/3D length is a different scale on an anisotropic or
 * sheared card. For the affine triangle map J, unit UV path T and its unit
 * perpendicular N, physical separation normal to the fibre is
 * |J(T) cross J(N)| / |J(T)|. Removing the component parallel to J(T) makes
 * the diameter invariant to UV shear as well as independent axis scaling.
 *
 * The point must be on a nondegenerate metre-space card patch and direction
 * must be nonzero. Unsupported patches throw instead of painting a fabricated
 * width. Geometry, texture and input vectors remain unchanged. This calculation
 * defines no anatomical thickness; the caller supplies that measurement.
 *
 * @evidence contracts/common.md#principled-implementation The affine triangle Jacobian maps a unit UV path and its perpendicular to metre-space vectors. Their cross-product area divided by path length is the physical perpendicular spacing, so inverse spacing converts a caller's metre diameter into a UV width without using the longitudinal scale.
 * @evidence contracts/common.md#clear-and-simple-design The shared locator owns patch admission; this function owns only the transverse metric used by lash texture preparation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The scale follows triangle positions and UVs; no document identity, photograph, expected output or tuned correction factor is inspected.
 * @evidence contracts/common.md#meaningful-documentation States the consumer, input units, metric derivation, unsupported patches and read-only ownership.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres and UV directions are dimensionless; the result is metres per unit transverse UV distance on the same triangle.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This metric owns no anatomical part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no authored shape channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits a scalar metric and no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no boundary; the locator reads the caller's existing triangle.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the regenerated lash asset owns the visual result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It introduces no anatomical dimension; the norm supplied to texture preparation owns the fibre diameter.
 * @evidenceExclude contracts/anatomy.md#permitted-range This is a metric degeneracy check and no physiological admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It consumes internal card geometry, not caller-authored body controls.
 */
export function faceEyelashTransverseScale(
  card: IEyelashCard,
  point: readonly [number, number],
  direction: readonly [number, number],
): number {
  const patch = locateFaceEyelashTriangle(card, point);
  if (patch === null)
    throw new Error("A lash diameter needs a point on its UV card.");
  const magnitude = Math.hypot(...direction);
  if (magnitude === 0)
    throw new Error("A lash diameter needs a nonzero UV direction.");
  const tangent: [number, number] = [
    direction[0] / magnitude,
    direction[1] / magnitude,
  ];
  const normal: [number, number] = [-tangent[1], tangent[0]];
  const { uv, xyz } = patch.triangle;
  const du = [uv[1][0] - uv[0][0], uv[2][0] - uv[0][0]];
  const dv = [uv[1][1] - uv[0][1], uv[2][1] - uv[0][1]];
  const determinant = du[0] * dv[1] - du[1] * dv[0];
  const map = ([u, v]: [number, number]): number[] => {
    const first = (dv[1] * u - du[1] * v) / determinant;
    const second = (du[0] * v - dv[0] * u) / determinant;
    return [0, 1, 2].map(
      (axis) =>
        first * (xyz[1][axis] - xyz[0][axis]) +
        second * (xyz[2][axis] - xyz[0][axis]),
    );
  };
  const t = map(tangent);
  const n = map(normal);
  const area = Math.hypot(
    t[1] * n[2] - t[2] * n[1],
    t[2] * n[0] - t[0] * n[2],
    t[0] * n[1] - t[1] * n[0],
  );
  const length = Math.hypot(...t);
  if (area === 0)
    throw new Error("A lash diameter needs a nondegenerate physical card.");
  return area / length;
}
