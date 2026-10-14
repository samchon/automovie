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
 * @evidence contracts/common.md#principled-implementation Evaluates the ordered affine chart (1-u-v,u,v), preserving corners and opposite-edge anchoring; finite closed-triangle inputs and representable arithmetic are required.
 * @evidence contracts/common.md#clear-and-simple-design Geometry, normal and attribute preparation share one scalar evaluator that preserves caller units and frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero coefficients suppress unused differences; corner/edge branches follow the affine partition, and overflow refuses rather than retuning precision.
 * @evidence contracts/common.md#meaningful-documentation Documents chart ordering, inactive coefficients, refusal boundaries and separately recorded floating reconstruction error.
 * @evidence contracts/performance.md#efficient-algorithms Fixed three-value/two-coordinate checks and at most two weighted differences use O(1) time/space.
 * @evidence contracts/performance.md#reuse-equivalent-work The pure operation is reused by preparation consumers without retaining earlier values or chart results.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar locals and refusal diagnostics exist; no source array, handle or task survives.
 */
export function interpolateHumanBasisSourceTriangle(
  values: readonly [number, number, number],
  coordinates: readonly [number, number],
): number {
  const [a, b, c]: readonly [number, number, number] = values;
  const [u, v]: readonly [number, number] = coordinates;
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
  const value: number =
    u + v === 1
      ? b + v * (c - b)
      : a + (u === 0 ? 0 : u * (b - a)) + (v === 0 ? 0 : v * (c - a));
  if (!Number.isFinite(value))
    throw new Error(
      "Source triangle interpolation exceeded finite affine arithmetic.",
    );
  return value;
}
