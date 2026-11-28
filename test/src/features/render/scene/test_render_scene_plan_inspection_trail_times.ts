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
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases state the reach, sample frequency, middle and boundary windows, and invalid inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that the planner emits the centered requested interval, clips samples to the film, and refuses invalid duration, time, reach and frequency.
 * @evidence contracts/development/testing.md#independent-expectations Lists expected ticks at 0.5 s spacing for the middle, start, and end, then supplies explicit examples of each invalid argument.
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