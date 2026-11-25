import { shotBeat } from "@automovie/render/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `shotBeat` names the beat of a shot id.
 *
 * Scenarios:
 *
 * 1. `shot:storm` names beat `storm`.
 * 2. An id without the prefix is its own beat, and only a leading prefix is
 *    removed.
 */
export function test_unit_render_root_shot_beat(): void {
  TestValidator.equals("prefixed", shotBeat("shot:storm"), "storm");
  TestValidator.equals("bare", shotBeat("storm"), "storm");
  TestValidator.equals("inner", shotBeat("a:shot:b"), "a:shot:b");
}