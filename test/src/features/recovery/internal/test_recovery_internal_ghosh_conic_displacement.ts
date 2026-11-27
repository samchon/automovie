import { AutoMovieRecoveryConicApproximation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `GhoshConicApproximationDisplacement` moves a barycentric coordinate along
 * its normal until it lies on the conic of weight rho, taking the root that
 * keeps every coordinate nonnegative.
 *
 * With rho = 1/2 and the normal (0, 1, 0), the conic condition is (1/4)(t +
 * l1)^2 = l0 l2, so the roots are t = -l1 +- 2 sqrt(l0 l2); only the larger
 * keeps l1 + t >= 0.
 *
 * Scenarios:
 *
 * 1. The coordinate (1, 2, 4) gives t = -2 + 2 * 2 = 2.
 * 2. The coordinate (1, 0, 0) is already on the conic (a double root at 0), so
 *    the displacement is 0.
 * 3. A zero normal has no displacement.
 */
export function test_recovery_internal_ghosh_conic_displacement(): void {
  const found = AutoMovieRecoveryConicApproximation.displaceGhoshApproximation({ value: [1, 2, 4], normal: [0, 1, 0] }, 0.5);
  TestValidator.predicate(
    "the larger root",
    found !== undefined && nclose(found, 2, 1e-12),
  );
  const onConic = AutoMovieRecoveryConicApproximation.displaceGhoshApproximation({ value: [1, 0, 0], normal: [0, 1, 0] }, 0.5);
  TestValidator.predicate(
    "already on the conic",
    onConic !== undefined && nclose(onConic, 0, 1e-12),
  );
  TestValidator.equals(
    "a zero normal",
    AutoMovieRecoveryConicApproximation.displaceGhoshApproximation({ value: [1, 2, 4], normal: [0, 0, 0] }, 0.5),
    undefined,
  );
}
