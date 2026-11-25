import { bracketedCrossing } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `bracketedCrossing` narrows a bracket around the point where a function
 * becomes "past" until it is no wider than the tolerance, keeping the low end
 * not past and the high end past, and reads known end values instead of the
 * function.
 *
 * Function: x - 0.3, past from 0 on, bracket [0, 1].
 *
 * Scenarios:
 *
 * 1. With a 1e-9 tolerance the bracket holds 0.3, its low end below and its high
 *    end at or above, no wider than 1e-9.
 * 2. With the ends' values given as known, the function is never read at 0 or 1,
 *    and the result is the same bracket.
 */
export function test_engine_math_bracketed_crossing(): void {
  const f = (x: number): number => x - 0.3;
  const past = (value: number): boolean => value >= 0;
  const plain: { low: number; high: number } = bracketedCrossing({
    f,
    past,
    low: 0,
    high: 1,
    tolerance: 1e-9,
  });
  TestValidator.predicate(
    "the bracket holds the crossing within the tolerance",
    plain.low < 0.3 && plain.high >= 0.3 && plain.high - plain.low <= 1e-9,
  );

  const reads: number[] = [];
  const known: { low: number; high: number } = bracketedCrossing({
    f: (x: number): number => {
      reads.push(x);
      return f(x);
    },
    past,
    low: 0,
    high: 1,
    known: { low: f(0), high: f(1) },
    tolerance: 1e-9,
  });
  TestValidator.equals(
    "known ends are not read and the bracket is the same",
    {
      endsRead: reads.filter((x: number): boolean => x === 0 || x === 1).length,
      bracket: known,
    },
    { endsRead: 0, bracket: plain },
  );
}
