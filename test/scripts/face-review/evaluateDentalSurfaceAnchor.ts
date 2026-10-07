import type { IDentalSurfaceAnchor } from "./IDentalSurfaceAnchor";

/**
 * Evaluate a registered surface point on read-only basis-frame metres.
 * Resident indices and an exact partition of unity prevent an anchor from
 * becoming an extrapolating displacement. Registration identity remains the
 * caller's evidence obligation; interpolation alone establishes no anatomy.
 * Floating-point interpolation may round; differences and accumulated output
 * that cannot be represented finitely refuse rather than being repaired.
 *
 * @evidence contracts/common.md#principled-implementation A nonnegative exact partition of unity interpolates resident coordinates through reference offsets, preserving a constant subnormal field. Finite differences and output are required; landmark identity and triangle support are not inferred.
 * @evidence contracts/common.md#clear-and-simple-design One read-only anchor evaluator owns the arithmetic used by registered axis and clinical landmarks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid correspondence, weights or arithmetic refuse; no source coordinate or weight is altered.
 * @evidence contracts/common.md#meaningful-documentation States residence, interpolation contract, units, source ownership, rounding and the unverified anatomical identity.
 * @evidence contracts/modeling.md#spatial-conventions Dimensionless weights retain the source metre frame in the returned point.
 */
export function evaluateDentalSurfaceAnchor(
  positions: readonly number[],
  anchor: IDentalSurfaceAnchor,
): number[] {
  if (
    anchor.vertices.length === 0 ||
    anchor.vertices.length !== anchor.weights.length ||
    anchor.weights.some((weight) => !Number.isFinite(weight) || weight < 0) ||
    anchor.weights.reduce((sum, weight) => sum + weight, 0) !== 1 ||
    anchor.vertices.some(
      (vertex) =>
        !Number.isInteger(vertex) ||
        vertex < 0 ||
        vertex * 3 + 2 >= positions.length,
    )
  )
    throw new Error(
      "A dental landmark needs resident vertices and nonnegative weights summing to one.",
    );
  // A partition of unity preserves a constant field exactly. Accumulating
  // offsets from one reference keeps equal subnormal coordinates from being
  // erased by multiplying each one by a fractional weight first.
  const reference = positions.slice(
    anchor.vertices[0] * 3,
    anchor.vertices[0] * 3 + 3,
  );
  const point = [0, 0, 0];
  anchor.vertices.forEach((vertex, at) => {
    for (let axis = 0; axis < 3; axis++) {
      const delta = positions[vertex * 3 + axis] - reference[axis];
      if (!Number.isFinite(delta))
        throw new Error(
          "A dental landmark needs finite source coordinates and representable interpolation differences.",
        );
      point[axis] += delta * anchor.weights[at];
    }
  });
  for (let axis = 0; axis < 3; axis++) point[axis] += reference[axis];
  if (!point.every(Number.isFinite))
    throw new Error(
      "Dental landmark interpolation arithmetic must remain finite.",
    );
  return point;
}
