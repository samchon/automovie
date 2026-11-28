import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `windowSampleTimes` lists the sample instants from `start` to `end` at a
 * rate, ending exactly on `end` without a duplicate.
 *
 * Scenarios:
 *
 * 1. 2 s to 3 s at 2 Hz is [2, 2.5, 3].
 * 2. At 3 Hz the 0 to 1 s window contains four samples, and the 0 to 1.1 s
 *    window ends at exactly 1.1 s.
 * 3. A zero-width window with a valid rate produces a singleton. Both public
 *    sampling entries reject non-positive or non-finite rates for zero width.
 * 4. A large start coalesces every sample that rounds to either endpoint.
 * 5. Opposite finite ends retain their binary quarter-grid even when their
 *    total span or a local offset exceeds binary64.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names exact start and end samples, whole and partial intervals, zero-width rate admission, duplicate coalescing, and a very wide finite span.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `windowSampleTimes` with explicit windows and rates. It checks the whole integer and extreme grids, the count or terminal sample in the fractional cases, and the singleton for zero length. It checks that both public grid readers throw RangeError for an invalid zero-width rate.
 * @evidence contracts/development/testing.md#independent-expectations At 2 Hz, the 2–3 s grid is [2, 2.5, 3]. At 2^53 a 0.25 s step is below the local 2 s spacing, leaving only the two represented ends. For the wide span a rate of 2^-1022 gives a 2^1022 step and seven exact symmetric instants.
 */
export function test_engine_motion_window_sample_times(): void {
  TestValidator.equals(
    "a whole number of steps",
    AutoMovieEngineMotionSampling.windowSampleTimes(2, 3, 2),
    [2, 2.5, 3],
  );
  TestValidator.equals("four instants", AutoMovieEngineMotionSampling.windowSampleTimes(0, 1, 3).length, 4);
  TestValidator.equals(
    "the last instant is the end",
    AutoMovieEngineMotionSampling.windowSampleTimes(0, 1.1, 3).at(-1),
    1.1,
  );
  TestValidator.equals("an empty window", AutoMovieEngineMotionSampling.windowSampleTimes(0, 0, 24), [0]);
  const tinyRate: number = Number.MIN_VALUE;
  TestValidator.equals(
    "a positive subnormal rate admits a finite singleton",
    AutoMovieEngineMotionSampling.windowSampleTimes(3, 3, tinyRate),
    [3],
  );
  const rejectsRate = (call: () => number[]): boolean => {
    try {
      call();
      return false;
    } catch (error) {
      return (
        error instanceof RangeError &&
        error.message.includes("ordered seconds grid")
      );
    }
  };
  for (const rate of [-Infinity, -1, 0, Infinity, NaN])
    TestValidator.predicate(
      `zero width refuses rate ${rate}`,
      rejectsRate(() => AutoMovieEngineMotionSampling.windowSampleTimes(3, 3, rate)) &&
        rejectsRate(() => AutoMovieEngineMotionSampling.sampleTimes(0, rate)),
    );
  const start: number = 2 ** 53;
  const end: number = start + 2;
  const narrow: number[] = AutoMovieEngineMotionSampling.windowSampleTimes(start, end, 4);
  TestValidator.predicate(
    "spacing below the local ulp leaves precisely the two represented instants",
    narrow.length === 2 &&
      nclose(narrow[0]!, start, 0) &&
      nclose(narrow[1]!, end, 0),
  );
  const limit: number = 2 ** 1023;
  const endpoint: number = 1.5 * limit;
  const wide: number[] = AutoMovieEngineMotionSampling.windowSampleTimes(-endpoint, endpoint, 2 ** -1022);
  const expected: readonly number[] = [
    -endpoint,
    -limit,
    -limit / 2,
    0,
    limit / 2,
    limit,
    endpoint,
  ];
  TestValidator.predicate(
    "half-scaled arithmetic preserves all seven long-window sample instants",
    wide.length === expected.length &&
      expected.every((time, index): boolean => nclose(wide[index]!, time, 0)),
  );
}
