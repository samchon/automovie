import { advanceAutoMovieGrid } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `advanceAutoMovieGrid` returns the first grid index after a read one that a
 * movement bound does not certify.
 *
 * Bound: travel(at, j) = j - at, so with margin 5 the indices 1..4 are
 * certified and 5 is the first not.
 *
 * Scenarios:
 *
 * 1. Margin 5 over a grid 0..10 returns 5.
 * 2. Margin 100 certifies the whole grid and returns end + 1 = 11.
 * 3. A margin of 0 certifies nothing and returns at + 1; a read at the grid end
 *    returns at + 1.
 * 4. A bound that is undefined certifies nothing: the next index.
 * 5. A negative bound is refused.
 */
export function test_engine_composition_advance_grid(): void {
  const linear = (from: number, to: number): number => to - from;
  TestValidator.equals(
    "first uncertified",
    advanceAutoMovieGrid(0, 10, 5, linear),
    5,
  );
  TestValidator.equals(
    "all certified",
    advanceAutoMovieGrid(0, 10, 100, linear),
    11,
  );
  TestValidator.equals("no margin", advanceAutoMovieGrid(0, 10, 0, linear), 1);
  TestValidator.equals(
    "at the end",
    advanceAutoMovieGrid(10, 10, 5, linear),
    11,
  );
  TestValidator.equals(
    "no bound",
    advanceAutoMovieGrid(3, 10, 5, () => undefined),
    4,
  );
  TestValidator.equals(
    "from the middle",
    advanceAutoMovieGrid(4, 10, 2.5, linear),
    7,
  );
  TestValidator.predicate(
    "negative",
    throwsError(() => advanceAutoMovieGrid(0, 10, 5, () => -1)),
  );
}
