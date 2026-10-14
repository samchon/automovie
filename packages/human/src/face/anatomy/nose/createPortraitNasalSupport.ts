/**
 * Resolve one nasal projection scale from a skin attachment plane. Three subject-owned points span that plane in head XY; height is measured in head Z, in millimetres. All samples, including nostril rims, use the same plane. This changes nasal projection, not lateral width or anatomical tip curvature. Omitted/one scale is exact identity and requires no support points.
 *
 * The plane is solved in coordinates normalized about the first datum. Signed distance from this plane is scaled uniformly, preserving its fixed points. A vertical or unresolved XY plane refuses rather than guessing another axis.
 *
 * @evidence contracts/common.md#principled-implementation Three copied datums resolve a normalized head-XY support plane whose Z height scales uniformly.
 * @evidence contracts/common.md#clear-and-simple-design One displacement field serves both exterior and pre-fit rim samples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity needs no support points; unresolved/near-vertical XY planes and nonfinite output refuse instead of choosing another axis.
 * @evidence contracts/common.md#meaningful-documentation Datum/sample coordinates and displacement are millimetres while the positive scale is dimensionless.
 * @evidence contracts/performance.md#efficient-algorithms Fixed three-point compilation and fixed arithmetic per later sample take constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Plane coefficients and copied origin are computed once and reused over every nasal sample.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure owns only derived coefficients/origin; no caller point array or sampled history is retained.
 */
export function createPortraitNasalSupport(
  points: readonly (readonly number[])[],
  scale: number = 1,
): (point: readonly number[]) => number {
  if (!Number.isFinite(scale) || scale <= 0)
    throw new Error("Nasal depth scale must be finite and positive.");
  if (scale === 1) return (): number => 0;
  if (
    points.length !== 3 ||
    points.some(
      (p: readonly number[]): boolean =>
        p.length !== 3 || !p.every(Number.isFinite),
    )
  )
    throw new Error(
      "Nasal depth scaling requires three finite skin support points.",
    );
  const origin: number[] = [...points[0]];
  const size: number = Math.max(
    ...points.flatMap((p: readonly number[]): number[] =>
      p.map((v: number, i: number): number => Math.abs(v - origin[i])),
    ),
  );
  if (!Number.isFinite(size) || size === 0)
    throw new Error("Nasal support plane needs a finite nonzero extent.");
  const [u, v]: number[][] = points
    .slice(1)
    .map((p: readonly number[]): number[] =>
      p.map((value: number, i: number): number => (value - origin[i]) / size),
    );
  const determinant: number = u[0] * v[1] - u[1] * v[0];
  if (Math.abs(determinant) <= 1e-10)
    throw new Error(
      "Nasal support points must span an unambiguous head-XY plane.",
    );
  const dx: number = (u[2] * v[1] - u[1] * v[2]) / determinant;
  const dy: number = (u[0] * v[2] - u[2] * v[0]) / determinant;
  return (point: readonly number[]): number => {
    if (point.length !== 3 || !point.every(Number.isFinite))
      throw new Error("Nasal support sampling requires finite XYZ.");
    const height: number =
      point[2] -
      origin[2] -
      dx * (point[0] - origin[0]) -
      dy * (point[1] - origin[1]);
    const displacement: number = (scale - 1) * height;
    if (!Number.isFinite(displacement))
      throw new Error("Nasal depth displacement exceeds its finite domain.");
    return displacement;
  };
}
