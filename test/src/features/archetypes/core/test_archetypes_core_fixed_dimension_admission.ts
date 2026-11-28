import {
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeSeat,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

/**
 * A seat admits an authored finite height through its shared draw session.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the valid height and the contract for raw, nonfinite and out-of-band values, alongside saved seed replay.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a real dining seat and checks its exact fixed height. Exercises the same producer with malformed values and confirms the structured refusal, original value and cited dimension range.
 * @evidence contracts/development/testing.md#independent-expectations The dining range runs from 0.43 to 0.457 metres. Height 0.44 belongs to that interval. A string, symbol and object are distinct input types, and infinity or 0.5 are outside the finite authored range. Both seed forms have the same historically supported text representation.
 */
export function test_archetypes_core_fixed_dimension_admission(): void {
  const create = (
    seatHeight: number,
  ): ReturnType<typeof AutoMovieArchetypeSeat.create> =>
    AutoMovieArchetypeSeat.create({ kind: "dining", seatHeight });
  TestValidator.equals(
    "a numeric authored value is preserved",
    create(0.44).dimensions.seatHeight,
    0.44,
  );

  const invalid: readonly unknown[] = [
    "0.44",
    Symbol("height"),
    {
      [Symbol.toPrimitive](): never {
        throw new Error("The fixed dimension must not be coerced.");
      },
    },
    Number.NaN,
    Infinity,
    0.5,
  ];
  for (const value of invalid)
    assert.throws(
      () => create(value as number),
      (error: unknown): boolean =>
        error instanceof AutoMovieArchetypeRefusal &&
        error.kind === "parameter" &&
        error.archetype === "seat" &&
        error.axis === "seatHeight" &&
        Object.is(error.value, value) &&
        error.feasible?.kind === "range" &&
        error.feasible.minimum === 0.43 &&
        error.feasible.maximum === 0.457 &&
        error.feasible.unit === "m",
    );
  const numericSeed = AutoMovieArchetypeSeat.create({ kind: "dining" }, 31);
  const savedSeed = AutoMovieArchetypeSeat.create(
    { kind: "dining" },
    "31" as unknown as number,
  );
  TestValidator.equals(
    "the historical seed text replays the same dimensions",
    savedSeed.dimensions,
    numericSeed.dimensions,
  );
}
