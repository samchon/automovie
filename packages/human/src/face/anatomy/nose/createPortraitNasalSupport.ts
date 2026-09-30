/**
 * Resolve one nasal projection scale from a skin attachment plane. Three
 * subject-owned points span that plane in head XY; height is measured in head
 * Z, in millimetres. All samples, including nostril rims, use the same plane.
 * This changes nasal projection, not lateral width or anatomical tip curvature.
 * Omitted/one scale is exact identity and requires no support points.
 *
 * The plane is solved in coordinates normalized about the first datum. Signed
 * distance from this plane is scaled uniformly, preserving its fixed points.
 * A vertical or unresolved XY plane refuses rather than guessing another axis.
 *
 * @evidence contracts/common.md#principled-implementation Three non-collinear head-XY points define the plane z = z0 + dx(x-x0) + dy(y-y0); solving the 2x2 system in coordinates normalised by the largest offset is Cramer's rule, and a near-zero determinant (vertical or unresolved plane) refuses instead of guessing an axis. Scaling the signed z-height above that plane by (scale-1) leaves every point on the plane fixed, which is the stated identity for scale one and the fixed support for other scales.
 * @evidence contracts/common.md#clear-and-simple-design One plane solve and one closure; scale one returns a constant zero without touching the points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is special-cased; the displacement depends on the three points, the scale and the sampled point only.
 * @evidence contracts/common.md#meaningful-documentation The comment states the plane, the units, the identity case, the normalisation and the refusals.
 * @evidence contracts/modeling.md#spatial-conventions Points and displacement are head millimetres (+X left, +Y up, +Z anterior); the height is measured along Z, not along the plane normal, as the comment states.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part or group; it is a numerical helper of the nasal projection owner.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no mesh primitives; it returns values for its caller to place.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface and meets no neighbouring part; the callers that share its result own the boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part or joint; the nose component that consumes it is the declaration that observes the assembled result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value, range or proportion of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; callers admit theirs.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is arithmetic on values its owner already named, not an input through which a caller shapes a human form.
 */
export function createPortraitNasalSupport(
  points: readonly (readonly number[])[],
  scale = 1,
): (point: readonly number[]) => number {
  if (!Number.isFinite(scale) || scale <= 0)
    throw new Error("Nasal depth scale must be finite and positive.");
  if (scale === 1) return () => 0;
  if (
    points.length !== 3 ||
    points.some((p) => p.length !== 3 || !p.every(Number.isFinite))
  )
    throw new Error(
      "Nasal depth scaling requires three finite skin support points.",
    );
  const origin = [...points[0]];
  const size = Math.max(
    ...points.flatMap((p) => p.map((v, i) => Math.abs(v - origin[i]))),
  );
  if (!Number.isFinite(size) || size === 0)
    throw new Error("Nasal support plane needs a finite nonzero extent.");
  const [u, v] = points
    .slice(1)
    .map((p) => p.map((value, i) => (value - origin[i]) / size));
  const determinant = u[0] * v[1] - u[1] * v[0];
  if (Math.abs(determinant) <= 1e-10)
    throw new Error(
      "Nasal support points must span an unambiguous head-XY plane.",
    );
  const dx = (u[2] * v[1] - u[1] * v[2]) / determinant;
  const dy = (u[0] * v[2] - u[2] * v[0]) / determinant;
  return (point) => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("Nasal support sampling requires finite XYZ.");
    const height =
      point[2] -
      origin[2] -
      dx * (point[0] - origin[0]) -
      dy * (point[1] - origin[1]);
    const displacement = (scale - 1) * height;
    if (!Number.isFinite(displacement))
      throw new Error("Nasal depth displacement exceeds its finite domain.");
    return displacement;
  };
}
