import { advanceAutoMovieGrid } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../../features/internal/throwsError";

/**
 * A certified grid step stops at the first instant that may violate the margin.
 *
 * Scenarios:
 * 1. Use a sine with known maximum speed and a linear bound with a finite validity horizon.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A certified grid step stops at the first instant that may violate the margin.
 * @evidence contracts/development/testing.md#independent-expectations The first crossing of half-amplitude sine at 0.45 is ceil(120 asin(0.9)/(2 pi)).
 * @evidence contracts/development/testing.md#distinguishing-cases A bound equal to the margin, a missing or negative bound and an exhausted grid each have distinct behavior.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_sweep_interval_certificate(): void {
  const hz: number = 120;
  const last: number = 2 * hz;
  for (const [limit, horizon] of [
    [0.45, last],
    [0.6, last],
    [0.6, hz],
  ] as const) {
    const reads: number[] = [];
    let k: number = 0;
    while (k <= last) {
      reads.push(k);
      const margin: number = limit - 0.5 * Math.sin((2 * Math.PI * k) / hz);
      if (margin < 0) break;
      k = advanceAutoMovieGrid(k, last, margin, (a, b) =>
        b > horizon ? undefined : (Math.PI * (b - a)) / hz,
      );
    }
    if (limit < 0.5) {
      const hit: number = Math.ceil(
        (hz * Math.asin(2 * limit)) / (2 * Math.PI),
      );
      TestValidator.predicate(
        "first sine crossing with certified skips",
        k === hit && reads.length < hit + 1,
      );
    } else {
      TestValidator.predicate("clear interval reaches the end", k === last + 1);
      if (horizon === last)
        TestValidator.predicate(
          "clear samples are skipped",
          reads.length * 3 < last + 1,
        );
      else
        TestValidator.equals(
          "uncertified tail is read in full",
          reads.filter((i) => i > horizon).length,
          last - horizon,
        );
    }
  }
  TestValidator.equals(
    "equality needs an actual observation",
    advanceAutoMovieGrid(0, 100, 1, (a, b) => (b - a) / 4),
    4,
  );
  TestValidator.equals(
    "zero margin advances one",
    advanceAutoMovieGrid(5, 100, 0, () => 0),
    6,
  );
  TestValidator.equals(
    "terminal step",
    advanceAutoMovieGrid(100, 100, 1, () => 0),
    101,
  );
  let queries: number = 0;
  const edge: number = advanceAutoMovieGrid(0, 2000, 1, (_a, b) => {
    ++queries;
    return b <= 1000 ? 0 : 2;
  });
  TestValidator.predicate(
    "logarithmic search to the first uncertified slot",
    edge === 1001 && queries <= 2 * Math.ceil(Math.log2(1000)) + 2,
  );
  TestValidator.predicate(
    "negative displacement bound refused",
    throwsError(() => advanceAutoMovieGrid(0, 10, 1, () => -1)),
  );
}
