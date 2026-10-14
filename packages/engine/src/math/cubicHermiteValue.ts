/**
 * One scalar component of glTF cubic Hermite interpolation.
 *
 * `outTangent` belongs to the left key and `inTangent` to the right; both are
 * derivatives per second, so the segment `span` scales them before the Hermite
 * basis is applied. The sampler and every range proof share this evaluator: a
 * validator proving a different polynomial than playback uses is no proof.
 *
 * @evidence contracts/common.md#principled-implementation Four cubic Hermite basis terms interpolate endpoints and derivatives; key-time span converts per-second tangents to normalized-segment derivatives.
 * @evidence contracts/common.md#clear-and-simple-design Playback and range proofs share this polynomial owner so their tangent scaling cannot drift.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither time nor tangents are clamped, preserving authored interpolation and caller-controlled extrapolation.
 * @evidence contracts/common.md#meaningful-documentation Identifies outgoing/incoming tangent ownership, derivative units, span scaling and shared sampler/range-proof responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Squared and cubed time are computed once for a fixed four-term polynomial, requiring constant arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work All basis terms reuse the same time powers; no sampled component is cached across changing times.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only scalar powers and the returned component exist, without retained keys, tangents or sample history.
 */
export const cubicHermiteValue: (
  left: number,
  outTangent: number,
  right: number,
  inTangent: number,
  span: number,
  t: number,
) => number = (
  left: number,
  outTangent: number,
  right: number,
  inTangent: number,
  span: number,
  t: number,
): number => {
  const t2: number = t * t;
  const t3: number = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * left +
    (t3 - 2 * t2 + t) * span * outTangent +
    (-2 * t3 + 3 * t2) * right +
    (t3 - t2) * span * inTangent
  );
};
