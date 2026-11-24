import { smoothMinimum } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";
import { throwsError } from "../../../../features/internal/throwsError";

/**
 * A softened upper bound meets both linear branches with their own tangents.
 *
 * Scenarios:
 * 1. Evaluate equality, both band edges and the one-sided derivative along the lower and the saturated branches.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A softened upper bound meets both linear branches with their own tangents.
 * @evidence contracts/development/testing.md#independent-expectations With width one half the equal-value blend is depressed by one eighth; entry slope is one and exit slope zero.
 * @evidence contracts/development/testing.md#distinguishing-cases Outside the band the smaller input is returned exactly and switching the two inputs changes no value.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_smooth_minimum(): void {
  const value = (x: number): number => smoothMinimum(x, 1, 0.5);
  TestValidator.predicate(
    "equal-input depression",
    nclose(value(1), 0.875, 1e-12),
  );
  TestValidator.predicate(
    "symmetric strict minimum outside band",
    value(0) === 0 && value(2) === 1 && smoothMinimum(1, 0, 0.5) === 0,
  );
  const h: number = 1e-5;
  TestValidator.predicate(
    "C1 at both edges",
    nclose((value(0.5 + h) - value(0.5)) / h, 1, 1e-5) &&
      nclose((value(1.5) - value(1.5 - h)) / h, 0, 1e-5),
  );
  TestValidator.predicate(
    "invalid widths and values refused",
    throwsError(() => smoothMinimum(0, 1, 0)) &&
      throwsError(() => smoothMinimum(NaN, 1, 1)),
  );
}
