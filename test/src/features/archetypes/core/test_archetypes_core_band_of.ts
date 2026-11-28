import { AutoMovieArchetypeBand } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

/**
 * `AutoMovieArchetypeBand.of` records a dimension's ends with their unit and
 * source, `provisional` only when it is true; `metres` is the same in metres.
 *
 * Scenarios:
 *
 * 1. Of("kg", 1, 2, "s") has no provisional field; with true it has one.
 * 2. Metres(0.5, 0.5, "s") is a fixed metre band.
 * 3. Ends out of order, 2 to 1, refuse.
 * 4. Both endpoints require finite numbers, even when they compare in order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the authored units, length endpoints, optional provisional mark and unsupported numeric values.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public band factories on ordinary, provisional, fixed and malformed endpoint pairs. Checks the complete records and both range-order and finite-number refusals.
 * @evidence contracts/development/testing.md#independent-expectations Literal endpoints and unit labels determine each complete band. An equal bound is a fixed dimension. Infinities and numbers in text representation fail the finite numeric contract.
 */
export function test_archetypes_core_band_of(): void {
  TestValidator.equals(
    "a sourced band",
    AutoMovieArchetypeBand.of("kg", 1, 2, "s"),
    { minimum: 1, maximum: 2, unit: "kg", source: "s" },
  );
  TestValidator.equals(
    "a provisional band",
    AutoMovieArchetypeBand.of("kg", 1, 2, "s", true),
    { minimum: 1, maximum: 2, unit: "kg", source: "s", provisional: true },
  );
  TestValidator.equals(
    "a fixed metre band",
    AutoMovieArchetypeBand.metres(0.5, 0.5, "s"),
    { minimum: 0.5, maximum: 0.5, unit: "m", source: "s" },
  );
  TestValidator.error("ends out of order", (): unknown =>
    AutoMovieArchetypeBand.of("m", 2, 1, "s"),
  );
  for (const [minimum, maximum] of [
    [-Infinity, 1],
    [0, Infinity],
    [Number.NaN, 1],
    ["0", 1],
    [0, Symbol("maximum")],
  ] as const)
    assert.throws(
      () =>
        AutoMovieArchetypeBand.metres(
          minimum as number,
          maximum as number,
          "s",
        ),
      { message: "Band endpoints must be finite numbers (s)" },
    );
}
