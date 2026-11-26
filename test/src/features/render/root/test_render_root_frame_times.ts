import { frameTimes } from "@automovie/render";
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
 */
export function test_render_root_frame_times(): void {
  const times: number[] = frameTimes(30, 2);
  TestValidator.predicate(
    "60 frames",
    times.length === 60 &&
      nclose(times[0]!, 0) &&
      nclose(times[1]!, 1 / 30) &&
      nclose(times[59]!, 59 / 30),
  );
  const partial: number[] = frameTimes(4, 0.55);
  TestValidator.predicate(
    "rounded encoded count excludes a partial final frame",
    partial.length === 2 && nclose(partial[0]!, 0) && nclose(partial[1]!, 0.25),
  );
  TestValidator.equals("no rate", frameTimes(0, 2), []);
  TestValidator.equals("no duration", frameTimes(30, 0), []);
  TestValidator.equals("infinite rate", frameTimes(Infinity, 2), []);
  TestValidator.equals("infinite duration", frameTimes(30, Infinity), []);
}
