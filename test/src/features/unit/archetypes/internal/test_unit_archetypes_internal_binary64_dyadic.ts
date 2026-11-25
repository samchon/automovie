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
  const parts = ArchetypeBinary64();
  TestValidator.equals("one", parts(1), {
    integer: 2n ** 52n,
    exponent: -52,
  });
  TestValidator.equals("one half", parts(0.5), {
    integer: 2n ** 52n,
    exponent: -53,
  });
  TestValidator.equals("three", parts(3), {
    integer: 3n * 2n ** 51n,
    exponent: -51,
  });
  TestValidator.equals("minus three", parts(-3), {
    integer: -3n * 2n ** 51n,
    exponent: -51,
  });
  TestValidator.equals("the least subnormal", parts(Number.MIN_VALUE), {
    integer: 1n,
    exponent: -1074,
  });
  TestValidator.error("infinity", (): unknown => parts(Infinity));
}
