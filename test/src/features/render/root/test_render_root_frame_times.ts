import { AutoMovieRenderScrub } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `frameTimes` samples a clip at index / fps for round(duration × fps) frames.
 *
 * Scenarios:
 *
 * 1. Two seconds at 30 fps: 60 frames at 0, 1/30, …, 59/30.
 * 2. A fractional frame count rounds before the grid is sampled.
 * 3. A zero or nonfinite rate or duration samples nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Samples encoded frame starts, rounds a fractional count, and returns no samples for invalid rates or durations.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the scrub grid reader at whole and fractional counts, zero boundaries, and infinite inputs.
 * @evidence contracts/development/testing.md#independent-expectations At 30 fps for two seconds the 60 samples run from 0 to 59/30. The quarter-second fractional case keeps exactly two samples.
 */
export function test_render_root_frame_times(): void {
  const times: number[] = AutoMovieRenderScrub.frameTimes(30, 2);
  TestValidator.predicate(
    "60 frames",
    times.length === 60 &&
      nclose(times[0]!, 0) &&
      nclose(times[1]!, 1 / 30) &&
      nclose(times[59]!, 59 / 30),
  );
  const partial: number[] = AutoMovieRenderScrub.frameTimes(4, 0.55);
  TestValidator.predicate(
    "rounded encoded count excludes a partial final frame",
    partial.length === 2 && nclose(partial[0]!, 0) && nclose(partial[1]!, 0.25),
  );
  TestValidator.equals("no rate", AutoMovieRenderScrub.frameTimes(0, 2), []);
  TestValidator.equals("no duration", AutoMovieRenderScrub.frameTimes(30, 0), []);
  TestValidator.equals("infinite rate", AutoMovieRenderScrub.frameTimes(Infinity, 2), []);
  TestValidator.equals("infinite duration", AutoMovieRenderScrub.frameTimes(30, Infinity), []);
}
