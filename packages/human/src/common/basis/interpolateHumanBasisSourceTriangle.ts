/**
 * Evaluate one component of a source triangle's affine field in its ordered
 * two-coordinate chart. Geometry, normal and attribute preparation share this
 * owner, retaining the component's caller-owned unit and frame.
 *
 * Values name corners 0, 1, 2. Coordinates [u,v] define the implicit partition
 * (1-u-v,u,v); no stored triple is renormalized. Exact corners retain their
 * stored values. On the opposite edge, u+v=1, corner zero is inactive and
 * evaluation anchors at corner one. Other zero coefficients likewise read
 * no difference. Callers may supply finite placeholders for inactive normal
 * components, but must validate every star whose coefficient is nonzero.
 *
 * Inputs are read only. Nonfinite values or coordinates, a point outside the
 * closed triangle, or unrepresentable affine arithmetic refuse. Floating
 * evaluation can differ from a redundant weighted sum; source preparation
 * records that reconstruction error rather than changing a tolerance to fit it.
 *
 * @evidence contracts/common.md#principled-implementation Two independent affine coordinates define partition of unity without a redundant sum constraint. Exact corners and the inactive-anchor edge use their supported local anchors; other points use corner0+u*(corner1-corner0)+v*(corner2-corner0). Finite arithmetic is required without claiming exact real-number evaluation.
 * @evidence contracts/common.md#clear-and-simple-design One scalar owner serves every geometry, normal and attribute component and owns chart admission, anchor choice and arithmetic refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source index or fixture selects an anchor; exact chart boundaries do, and no coefficient is renormalized or hidden behind an epsilon.
 * @evidence contracts/common.md#meaningful-documentation States corner order, chart domain, implicit weights, inactive fields, units, ownership and reconstruction limits.
 * @evidence contracts/modeling.md#spatial-conventions u and v are dimensionless; each component retains its caller's common unit and coordinate frame with no conversion.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping This numerical interpolation defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels Source chart coordinates are compiled correspondence, not person-authoring channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The helper evaluates one existing field component and emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The helper carries a caller's shared chart; its compiler and assembly own boundary construction.
 * @evidenceExclude contracts/modeling.md#rendered-observation The helper owns affine arithmetic only; source preparation and the consuming assembly observe their geometry and normal field.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The helper supplies no anatomical value, proportion or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range A closed mathematical triangle is not an anatomical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The helper creates no public input through which a caller shapes a person.
 */
export function interpolateHumanBasisSourceTriangle(
  values: readonly [number, number, number],
  coordinates: readonly [number, number],
): number {
  const [a, b, c] = values;
  const [u, v] = coordinates;
  if (![a, b, c].every(Number.isFinite))
    throw new Error(
      "Source triangle interpolation needs finite corner values.",
    );
  if (!Number.isFinite(u) || !Number.isFinite(v) || u < 0 || v < 0 || u + v > 1)
    throw new Error(
      "Source triangle coordinates must lie in its finite closed chart.",
    );
  if (u === 0 && v === 0) return a;
  if (u === 1) return b;
  if (v === 1) return c;
  const value =
    u + v === 1
      ? b + v * (c - b)
      : a + (u === 0 ? 0 : u * (b - a)) + (v === 0 ? 0 : v * (c - a));
  if (!Number.isFinite(value))
    throw new Error(
      "Source triangle interpolation exceeded finite affine arithmetic.",
    );
  return value;
}
