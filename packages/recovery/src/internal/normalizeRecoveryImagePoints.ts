/**
 * Centre matched image points and set their mean Euclidean distance to sqrt(2).
 * Hartley's normalized eight-point construction acts on the original design:
 * https://users.cecs.anu.edu.au/~hartley/Papers/fundamental/fundamental.pdf
 * Coincident or nonrepresentable charts refuse instead of adding an arbitrary
 * spread. This normalization changes a fitting chart, never source pixels.
 *
 * @evidence contracts/common.md#principled-implementation Independent centroid and mean-distance normalization balances the image design before original-matrix SVD. A zero or unrepresentable spread cannot identify a projective fit and throws rather than receiving an epsilon scale.
 * @evidence contracts/common.md#clear-and-simple-design Fundamental and homography fits share the same image-normalization convention and receive the transform needed for explicit denormalization.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No point deletion, coordinate rounding, guessed spread or normal matrix repairs a degenerate observation set.
 * @evidence contracts/common.md#meaningful-documentation States the sqrt(2) mean-distance convention, original-pixel preservation, transform order and refusal cases.
 * @evidence contracts/performance.md#efficient-algorithms Three O(N) scans compute centroid, mean distance and normalized coordinates, with O(N) returned storage and one fixed transform.
 * @evidence contracts/performance.md#reuse-equivalent-work One transform normalizes all observations of its current fitting set; a changed RANSAC subset has a different centroid/spread and is not cached as equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Normalized points and one nine-number transform transfer to the caller; borrowed observations are unchanged and no state survives globally.
 */
export function normalizeRecoveryImagePoints(
  points: readonly (readonly [number, number])[],
): { points: [number, number][]; transform: number[] } {
  if (points.length === 0) throw new Error("camera-design: empty point population");
  let cx: number = 0, cy: number = 0;
  for (const point of points) { cx += point[0]; cy += point[1]; }
  cx /= points.length; cy /= points.length;
  let distance: number = 0;
  for (const point of points) distance += Math.hypot(point[0] - cx, point[1] - cy);
  distance /= points.length;
  const scale: number = Math.SQRT2 / distance;
  if (!(distance > 0) || !Number.isFinite(distance) || !(scale > 0) || !Number.isFinite(scale))
    throw new Error("camera-design: coincident or unrepresentable normalization");
  const normalized: [number, number][] = points.map(
    (point: readonly [number, number]): [number, number] => [(point[0] - cx) * scale, (point[1] - cy) * scale],
  );
  const transform: number[] = [scale, 0, -scale * cx, 0, scale, -scale * cy, 0, 0, 1];
  if (!transform.every(Number.isFinite) || normalized.some(
    (point: [number, number]): boolean => !point.every(Number.isFinite),
  )) throw new Error("camera-design: normalized chart is not finite");
  return { points: normalized, transform };
}
