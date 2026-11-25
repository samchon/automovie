import { ArchetypeBinary64 } from "@automovie/archetypes/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `ArchetypeBinary64` splits a finite binary64 into a signed integer times a
 * power of two, exactly.
 *
 * Scenarios:
 *
 * 1. 1 is 2^52 times 2^-52 and 0.5 is 2^52 times 2^-53.
 * 2. 3 is 3 * 2^51 times 2^-51, and -3 is its negation.
 * 3. The least subnormal, Number.MIN_VALUE, is 1 times 2^-1074.
 * 4. An infinite value is refused.
 */
export function test_unit_archetypes_internal_binary64_dyadic(): void {
  const parts: ReturnType<typeof ArchetypeBinary64> = ArchetypeBinary64();
  function expect(
    label: string,
    value: number,
    integer: bigint,
    exponent: number,
  ): void {
    const actual: ReturnType<typeof parts> = parts(value);
    TestValidator.predicate(
      label,
      actual.integer === integer && actual.exponent === exponent,
    );
  }

  expect("one", 1, 2n ** 52n, -52);
  expect("one half", 0.5, 2n ** 52n, -53);
  expect("three", 3, 3n * 2n ** 51n, -51);
  expect("minus three", -3, -3n * 2n ** 51n, -51);
  expect("the least subnormal", Number.MIN_VALUE, 1n, -1074);
  TestValidator.error("infinity", (): unknown => parts(Infinity));
}
