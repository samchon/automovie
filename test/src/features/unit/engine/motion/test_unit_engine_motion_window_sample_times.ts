import { windowSampleTimes } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

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
 */
export function test_unit_engine_motion_window_sample_times(): void {
  TestValidator.equals(
    "a whole number of steps",
    windowSampleTimes(2, 3, 2),
    [2, 2.5, 3],
  );
  TestValidator.equals("four instants", windowSampleTimes(0, 1, 3).length, 4);
  TestValidator.equals(
    "the last instant is the end",
    windowSampleTimes(0, 1.1, 3).at(-1),
    1.1,
  );
  TestValidator.equals("an empty window", windowSampleTimes(0, 0, 24), [0]);
}
