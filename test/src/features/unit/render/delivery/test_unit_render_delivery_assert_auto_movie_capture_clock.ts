import { assertAutoMovieCaptureClock } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `assertAutoMovieCaptureClock` accepts a ready page with the commissioned
 * clock and a frame count of duration times rate.
 *
 * Scenarios:
 *
 * 1. A ready page of 2 s at 24 fps counting 48 frames passes.
 * 2. A page that is not ready, a different duration, a different rate and a
 *    different frame count are each refused.
 */
export function test_unit_render_delivery_assert_auto_movie_capture_clock(): void {
  const expected: { durationSeconds: number; fps: number } = {
    durationSeconds: 2,
    fps: 24,
  };
  const page = (
    patch: Partial<{
      ready: boolean;
      durationSeconds: number;
      fps: number;
      frameCount: number;
    }>,
  ): { ready: boolean; durationSeconds: number; fps: number; frameCount: number } => ({
    ready: true,
    durationSeconds: 2,
    fps: 24,
    frameCount: 48,
    ...patch,
  });
  assertAutoMovieCaptureClock(page({}), expected);
  for (const patch of [
    { ready: false },
    { durationSeconds: 3, frameCount: 72 },
    { fps: 30, frameCount: 60 },
    { frameCount: 47 },
  ])
    TestValidator.error(JSON.stringify(patch), (): void => {
      assertAutoMovieCaptureClock(page(patch), expected);
    });
}