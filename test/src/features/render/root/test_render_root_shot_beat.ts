import {
  shotBeat
} from "../../../../../packages/render/src/shotBeat";
import { TestValidator } from "@nestia/e2e";

/**
 * `shotBeat` names the beat of a shot id.
 *
 * Scenarios:
 *
 * 1. `shot:storm` names beat `storm`.
 * 2. An id without the prefix is its own beat, and only a leading prefix is
 *    removed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Removes the leading shot prefix while preserving bare and embedded text.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the beat-name reader for a prefixed, a bare and an internally prefixed identifier.
 * @evidence contracts/development/testing.md#independent-expectations The three literal strings isolate the leading-prefix rule from replacing an interior substring.
 */
export function test_render_root_shot_beat(): void {
  TestValidator.equals("prefixed", shotBeat("shot:storm"), "storm");
  TestValidator.equals("bare", shotBeat("storm"), "storm");
  TestValidator.equals("inner", shotBeat("a:shot:b"), "a:shot:b");
}