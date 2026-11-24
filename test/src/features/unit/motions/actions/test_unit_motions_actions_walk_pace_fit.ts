import type { IAutoMovieMotionHumanWalkPace } from "@automovie/interface";
import { WalkPace } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `WalkPace.fit` takes the fewest steps whose cruising step is no longer than
 * the longest: at least two for any way to go, one for none.
 *
 * Scenarios, at 1 m/s, a 1 s period and a swing of 0.8 periods:
 *
 * 1. 4 m with a 1 m longest step takes 4 steps.
 * 2. 0.3 m takes the least of 2.
 * 3. No way takes 1.
 * 4. Each fit's cruising step is no longer than the longest.
 */
export function test_unit_motions_actions_walk_pace_fit(): void {
  const props = (distance: number): IAutoMovieMotionHumanWalkPace.IProps => ({
    distance,
    speed: 1,
    share: 0.8,
    period: (): number => 1,
  });
  const fits: WalkPace[] = [4, 0.3, 0].map(
    (d: number): WalkPace => WalkPace.fit(props(d), 1),
  );
  TestValidator.equals(
    "the steps",
    fits.map((p: WalkPace): number => p.steps),
    [4, 2, 1],
  );
  TestValidator.predicate(
    "no longer than the longest",
    fits.every((p: WalkPace): boolean => p.stride <= 1 + 1e-6),
  );
}
