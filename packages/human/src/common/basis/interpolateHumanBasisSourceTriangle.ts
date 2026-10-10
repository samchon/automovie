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
