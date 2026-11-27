import { AutoMovieRenderInspection } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderInspection.planTrailTimes` lists the trail samples around a second.
 *
 * Scenarios:
 *
 * 1. Reach 1 s at 2 ticks per second around second 2 of 10 gives 1, 1.5, 2,
 *    2.5 and 3.
 * 2. Samples outside `[0, duration]` are dropped: around 0.5 the first is 0.
 * 3. A non-positive duration, a second outside the duration and a reach or tick
 *    count of zero are refused.
 */
export function test_render_scene_plan_inspection_trail_times(): void {
  const plan = (
    seconds: number,
    durationSeconds: number,
    reach: number = 1,
    ticks: number = 2,
  ): number[] =>
    AutoMovieRenderInspection.planTrailTimes({
      request: { reach, ticks },
      seconds,
      durationSeconds,
    });
  TestValidator.equals("middle", plan(2, 10), [1, 1.5, 2, 2.5, 3]);
  TestValidator.equals("start", plan(0.5, 10), [0, 0.5, 1, 1.5]);
  TestValidator.equals("end", plan(10, 10), [9, 9.5, 10]);
  for (const [seconds, duration, reach, ticks] of [
    [1, 0, 1, 2],
    [11, 10, 1, 2],
    [1, 10, 0, 2],
    [1, 10, 1, 0],
  ] as const)
    TestValidator.error(
      `${seconds} ${duration} ${reach} ${ticks}`,
      (): void => {
        plan(seconds, duration, reach, ticks);
      },
    );
}