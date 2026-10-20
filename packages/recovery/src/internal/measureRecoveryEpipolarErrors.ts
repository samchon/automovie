import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";

/**
 * Measure signed Sampson distance and mean two-sided point-to-line distance
 * in the supplied integer-pixel-centre charts. Undefined lines or nonfinite
 * residuals remain null observations and cannot be counted as inliers. Invalid
 * matrices or nonrepresentable matrix-vector actions throw in the algebra owner.
 * Sampson distance is a local approximation, not reprojection truth.
 *
 * @evidence contracts/common.md#principled-implementation For e=x2-transpose F x1, Sampson residual divides e by the joint norm of both epipolar line normals, while symmetric error averages the two absolute point-to-line distances. Homogeneous F scale cancels in both expressions.
 * @evidence contracts/common.md#clear-and-simple-design One measurement pass supplies consensus residuals and final pixel diagnostics in the same chart, keeping undefined geometry explicit rather than overloading a finite error.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero normals and nonfinite residuals return null; malformed or overflowing matrix actions throw. No epsilon denominator, pixel clamp or selected correspondence conceals a degenerate line.
 * @evidence contracts/common.md#meaningful-documentation Gives the two distinct error definitions, pixel units, signed convention, null meaning and local-approximation limitation.
 * @evidence contracts/performance.md#efficient-algorithms For N pairs, one transpose and two fixed matrix-vector actions per pair require O(N) time and O(N) result storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Both diagnostics share the two lines and scalar incidence for each pair; F-transpose is computed once for the full pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only owned scalar records escape, with no borrowed points, cache, image buffer or external handle retained.
 */
export function measureRecoveryEpipolarErrors(
  matrix: readonly number[],
  first: readonly (readonly [number, number])[],
  second: readonly (readonly [number, number])[],
): ({ signedSampsonPx: number; symmetricPointLinePx: number } | null)[] {
  if (first.length !== second.length)
    throw new Error("camera-error: paired points required");
  const transpose: number[] = AutoMovieMatrix3.transpose(matrix);
  return first.map(
    (
      point: readonly [number, number],
      at: number,
    ): {
      signedSampsonPx: number;
      symmetricPointLinePx: number;
    } | null => {
      const other: readonly [number, number] = second[at]!;
      const line2: [number, number, number] = AutoMovieMatrix3.apply(matrix, [
        point[0],
        point[1],
        1,
      ]);
      const line1: [number, number, number] = AutoMovieMatrix3.apply(
        transpose,
        [other[0], other[1], 1],
      );
      const incidence: number =
        other[0] * line2[0] + other[1] * line2[1] + line2[2];
      const norm1: number = Math.hypot(line1[0], line1[1]);
      const norm2: number = Math.hypot(line2[0], line2[1]);
      if (!(norm1 > 0) || !(norm2 > 0) || !Number.isFinite(incidence))
        return null;
      const signedSampsonPx: number = incidence / Math.hypot(norm1, norm2);
      const symmetricPointLinePx: number =
        (Math.abs(incidence) / norm1 + Math.abs(incidence) / norm2) / 2;
      return Number.isFinite(signedSampsonPx) &&
        Number.isFinite(symmetricPointLinePx)
        ? { signedSampsonPx, symmetricPointLinePx }
        : null;
    },
  );
}
