import type { AutoMovieVector3Tuple } from "@automovie/interface";
import { norm } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `norm` scales a vector to unit length, leaving the zero vector zero.
 *
 * Scenarios:
 *
 * 1. (0, 3, 4) of length 5 is (0, 0.6, 0.8), to rounding.
 * 2. The zero vector stays zero.
 */
export function test_unit_recovery_internal_norm(): void {
  const unit: AutoMovieVector3Tuple = norm([0, 3, 4]);
  TestValidator.predicate(
    "a unit vector",
    unit[0] === 0 && nclose(unit[1], 0.6, 1e-15) && nclose(unit[2], 0.8, 1e-15),
  );
  TestValidator.equals("the zero vector", norm([0, 0, 0]), [0, 0, 0]);
}
