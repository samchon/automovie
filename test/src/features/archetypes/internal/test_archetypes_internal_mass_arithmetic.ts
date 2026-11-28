import {
  ArchetypeMassArithmetic
} from "../../../../../packages/archetypes/src/core/internal/ArchetypeMassArithmetic";
import { TestValidator } from "@nestia/e2e";

/**
 * Mass arithmetic rounds the physical result at binary64 boundaries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names numeric boundaries for signed products, local weight, cancellation, ratios, weighted moments and means.
 * @evidence contracts/development/testing.md#behavioral-verification Calls each actual arithmetic owner at binary64 limits and checks exact values and refusals. Exercises intermediate underflow and overflow, a zero total and exact local subnormal admission.
 * @evidence contracts/development/testing.md#independent-expectations The signed least-value product is minus twice the least positive value. Opposite maximum terms cancel exactly and large equal scales cancel before a 1/4 ratio. Three equal weights on opposite large coordinates and one give mean 1/3.
 */
export function test_archetypes_internal_mass_arithmetic(): void {
  const least: number = Number.MIN_VALUE;
  const greatest: number = Number.MAX_VALUE;
  TestValidator.equals(
    "intermediate multiplication underflows while its full product survives",
    ArchetypeMassArithmetic.product(-least, 0.5, 4),
    -2 * least,
  );
  TestValidator.equals(
    "a local weight accepts only an exactly representable subnormal",
    [
      ArchetypeMassArithmetic.localProduct(least, 2),
      ArchetypeMassArithmetic.localProduct(least, 1.5),
    ],
    [2 * least, null],
  );
  TestValidator.equals(
    "opposing terms recover a finite sum after intermediate overflow",
    ArchetypeMassArithmetic.sum([greatest, greatest, -greatest]),
    greatest,
  );
  TestValidator.equals(
    "the mass scale cancels before the weight ratio is rounded",
    ArchetypeMassArithmetic.ratio(greatest, 2, greatest, 8),
    1 / 4,
  );
  TestValidator.equals(
    "separate inertial factors recover an underflowed mass share",
    ArchetypeMassArithmetic.weightedProduct(least, 1, 2, 2)(-2, 4),
    -2 * least,
  );

  TestValidator.equals(
    "mass proportions survive an overflowing unscaled total",
    ArchetypeMassArithmetic.normalization([greatest, greatest / 2]),
    { scale: greatest, total: 1.5 },
  );
  TestValidator.equals(
    "a nonuniform mean retains the term lost by scale division",
    ArchetypeMassArithmetic.mean([greatest, 0], [least, greatest]),
    least,
  );
  // The two large opposite coordinates cancel exactly, leaving one third.
  TestValidator.equals(
    "exact mean retains the middle of three equal-weight coordinates",
    ArchetypeMassArithmetic.mean([2 ** 54, 1, -(2 ** 54)], [1, 1, 1], true),
    1 / 3,
  );
  TestValidator.error("mean requires positive total weight", (): number =>
    ArchetypeMassArithmetic.mean([1], [0]),
  );
}
