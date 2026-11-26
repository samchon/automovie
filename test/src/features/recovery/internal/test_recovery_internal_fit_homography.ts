import { AutoMovieRecoveryCameraGeometry } from "@automovie/recovery";
import type { IAutoMovieRecoveryHomographyFittingOperation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `fitRecoveryHomography` fits a normalized DLT map from first-image pixels to
 * second-image pixels, scaled to unit Frobenius norm, with its inverse.
 *
 * Scenarios:
 *
 * 1. The corners of a 100 pixel square shifted by (5, 3) give the translation
 *    homography [1, 0, 5 | 0, 1, 3 | 0, 0, 1] up to one scale s, so the ratios
 *    to the first entry are fixed, |s| = 1 / √37, and the inverse composes with
 *    the matrix to the identity times s^2 up to scale.
 * 2. Fewer than four pairs are refused.
 */
export function test_recovery_internal_fit_homography(): void {
  const first: [number, number][] = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ];
  const second: [number, number][] = first.map(
    (point: [number, number]): [number, number] => [point[0] + 5, point[1] + 3],
  );
  const fitted: ReturnType<IAutoMovieRecoveryHomographyFittingOperation.Operation> =
    AutoMovieRecoveryCameraGeometry.fitHomography(first, second, 1e-8, 64);
  const m: number[] = fitted.matrix;
  const eps: number = 1e-9;
  TestValidator.predicate(
    "the matrix is the translation up to scale",
    nclose(Math.abs(m[0]!), 1 / Math.sqrt(37), eps) &&
      nclose(m[4]! / m[0]!, 1, eps) &&
      nclose(m[8]! / m[0]!, 1, eps) &&
      nclose(m[2]! / m[0]!, 5, eps) &&
      nclose(m[5]! / m[0]!, 3, eps) &&
      nclose(m[1]!, 0, eps) &&
      nclose(m[3]!, 0, eps) &&
      nclose(m[6]!, 0, eps) &&
      nclose(m[7]!, 0, eps),
  );
  const v: number[] = fitted.inverse;
  TestValidator.predicate(
    "the inverse undoes the shift",
    nclose(v[2]! / v[0]!, -5, eps) &&
      nclose(v[5]! / v[0]!, -3, eps) &&
      nclose(v[0]! * m[0]!, 1, eps),
  );
  TestValidator.error("three pairs", (): unknown =>
    AutoMovieRecoveryCameraGeometry.fitHomography(first.slice(0, 3), second.slice(0, 3), 1e-8, 64),
  );
}
