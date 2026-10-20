/**
 * Construct an orthonormal tangent of the current unit seed translation.
 *
 * @evidence contracts/common.md#principled-implementation Projecting the least-aligned Cartesian axis and taking t cross a gives a resolved orthonormal two-coordinate sphere chart.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns the seed's single scale gauge for both joint derivatives and their matching retraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonunit or unresolved input throws; no baseline component or camera orientation is frozen beyond the declared scale gauge.
 * @evidence contracts/common.md#meaningful-documentation States unit input, axis selection and two camera-frame tangent directions.
 * @evidence contracts/performance.md#efficient-algorithms Three coordinates and one cross product require constant time and memory.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A current local tangent is rebuilt after its pose changes and has no global cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only two owned tuples return and no external resource is acquired.
 */
export function createRecoveryMapTangent(
  t: readonly [number, number, number],
): [number, number, number][] {
  if (!t.every(Number.isFinite) || Math.abs(Math.hypot(...t) - 1) > 1e-10)
    throw new Error("camera-map: unit seed translation required");
  let least: number = 0;
  for (let at: number = 1; at < 3; at++)
    if (Math.abs(t[at]!) < Math.abs(t[least]!)) least = at;
  const a: [number, number, number] = [0, 0, 0];
  for (let at: number = 0; at < 3; at++)
    a[at] = (at === least ? 1 : 0) - t[at]! * t[least]!;
  const norm: number = Math.hypot(...a);
  for (let at: number = 0; at < 3; at++) a[at] = a[at]! / norm;
  return [
    a,
    [
      t[1] * a[2] - t[2] * a[1],
      t[2] * a[0] - t[0] * a[2],
      t[0] * a[1] - t[1] * a[0],
    ],
  ];
}
