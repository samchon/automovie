import { sampleTimes } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `sampleTimes` lists the instants from 0 to a duration at a rate.
 *
 * Scenarios:
 *
 * 1. 1 s at 4 Hz is [0, 0.25, 0.5, 0.75, 1].
 */
export function test_unit_engine_motion_sample_times(): void {
  TestValidator.equals(
    "a quarter-second grid",
    sampleTimes(1, 4),
    [0, 0.25, 0.5, 0.75, 1],
  );
}
