import { everydayGestureSwings } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `everydayGestureSwings` counts a sampled gesture's swings: its interior local
 * maxima standing above a quarter of the signal's range from its least value.
 *
 * Scenarios:
 *
 * 1. Two equal peaks count two.
 * 2. A tremor of a tenth of the range beside a full peak counts only the peak.
 * 3. A plateau counts once, at its rising edge.
 * 4. The ends of the signal are never peaks.
 */
export function test_unit_motions_executable_everyday_gesture_swings(): void {
  TestValidator.equals(
    "peaks above a quarter of the range",
    [
      everydayGestureSwings([0, 1, 0, 1, 0]),
      everydayGestureSwings([0, 0.1, 0, 1, 0]),
      everydayGestureSwings([0, 1, 1, 0]),
      everydayGestureSwings([1, 0, 1]),
    ],
    [2, 1, 1, 0],
  );
}
