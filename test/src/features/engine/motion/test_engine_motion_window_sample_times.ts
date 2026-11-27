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
 * 2. A window that is not a whole number of steps ends on `end`: 0 to 1 at 3 Hz is
 *    [0, 1/3, 2/3, 1].
 * 3. An empty window is the one instant.
 * 4. A large start coalesces every sample that rounds to either endpoint.
 * 5. Opposite finite ends retain their binary quarter-grid even when their
 *    total span or a local offset exceeds binary64.
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
