import { createViewerDisplayClock } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `createViewerDisplayClock` keeps the second of the last completed frame: a
 * frame produced inside `run` completes at that run's second, and an explicit
 * second overrides it.
 *
 * Scenarios:
 *
 * 1. A new clock shows 0.
 * 2. Completing inside `run(2, …)` shows 2; outside, completing keeps 2.
 * 3. `complete(5)` shows 5; a negative second is refused.
 */
export function test_unit_viewer_root_display_clock(): void {
  const clock: ReturnType<typeof createViewerDisplayClock> =
    createViewerDisplayClock();
  TestValidator.equals("a new clock", clock.current(), 0);
  clock.run(2, (): void => {
    clock.complete();
  });
  TestValidator.equals("inside a run", clock.current(), 2);
  TestValidator.equals("outside a run", clock.complete(), 2);
  TestValidator.equals("an explicit second", clock.complete(5), 5);
  TestValidator.error("a negative second", (): number => clock.complete(-1));
}
