import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `filterRecoveryImageGaussian` applies a normalized sampled Gaussian of
 * radius round(4 sigma), or its derivative, separably with half-sample
 * reflection.
 *
 * Scenarios:
 *
 * 1. A constant chart stays constant, and its x derivative is zero.
 * 2. A unit impulse at the centre of a 9 by 9 chart, with sigma 1 and so radius
 *    4, reads g(0)^2 at the centre, where g(k) = exp(-k^2 / 2) / sum of the
 *    nine samples, and the x derivative one pixel to its right reads -g(0) *
 *    g(1).
 */
export function test_recovery_internal_filter_image_gaussian(): void {
  const constant: Float64Array = new Float64Array(12).fill(5);
  const blurred: Float64Array = AutoMovieRecoveryObservation.filterImageGaussian(
    constant,
    4,
    3,
    2,
  );
  const slope: Float64Array = AutoMovieRecoveryObservation.filterImageGaussian(
    constant,
    4,
    3,
    2,
    "x",
  );
  TestValidator.predicate(
    "a constant chart stays constant",
    Array.from(blurred).every((value: number): boolean =>
      nclose(value, 5, 1e-12),
    ),
  );
  TestValidator.predicate(
    "a constant chart has no slope",
    Array.from(slope).every((value: number): boolean =>
      nclose(value, 0, 1e-12),
    ),
  );

  const impulse: Float64Array = new Float64Array(81);
  impulse[4 * 9 + 4] = 1;
  let total: number = 0;
  for (let k: number = -4; k <= 4; k++) total += Math.exp(-0.5 * k * k);
  const g0: number = 1 / total;
  const g1: number = Math.exp(-0.5) / total;
  const centre: Float64Array = AutoMovieRecoveryObservation.filterImageGaussian(impulse, 9, 9, 1);
  const derivative: Float64Array = AutoMovieRecoveryObservation.filterImageGaussian(
    impulse,
    9,
    9,
    1,
    "x",
  );
  TestValidator.predicate(
    "the impulse response at the centre",
    nclose(centre[4 * 9 + 4]!, g0 * g0, 1e-12),
  );
  TestValidator.predicate(
    "the derivative beside the impulse",
    nclose(derivative[4 * 9 + 5]!, -g0 * g1, 1e-12),
  );
}
