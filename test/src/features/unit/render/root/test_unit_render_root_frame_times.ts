import { frameTimes } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/**
 * `frameTimes` samples a clip at index / fps for round(duration × fps) frames.
 *
 * Scenarios:
 *
 * 1. Two seconds at 30 fps: 60 frames at 0, 1/30, …, 59/30.
 * 2. A zero rate or a zero duration samples nothing.
 */
export function test_unit_render_root_frame_times(): void {
  const times: number[] = frameTimes(30, 2);
  TestValidator.predicate(
    "60 frames",
    times.length === 60 &&
      nclose(times[0]!, 0) &&
      nclose(times[1]!, 1 / 30) &&
      nclose(times[59]!, 59 / 30),
  );
  TestValidator.equals("no rate", frameTimes(0, 2), []);
  TestValidator.equals("no duration", frameTimes(30, 0), []);
}
