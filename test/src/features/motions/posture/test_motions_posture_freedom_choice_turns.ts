import {
  HumanFreedomChoice
} from "../../../../../packages/motions/src/posture/internal/HumanFreedomChoice";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `HumanFreedomChoice.turns` enumerates the turns a free choice tries, nearest
 * first: none, then each multiple of the step on the preferred side and the
 * other, up to the half turn, which is tried once.
 *
 * Scenarios:
 *
 * 1. At 45 degrees preferring the right: 0, 45, −45, 90, −90, 135, −135, 180;
 *    preferring the left, the signs swap and 180 is still once.
 * 2. A step of zero, a negative or one too small to advance is refused.
 * 3. An infinite step leaves only no turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines nearest-first signed turn enumeration and advancing-step admission.
 * @evidence contracts/development/testing.md#behavioral-verification Enumerates choices at 45° for each preference and tries zero, negative, underflowing and infinite step inputs.
 * @evidence contracts/development/testing.md#independent-expectations The angular grid alternates sign and includes one half turn. Infinite step leaves only 0, while nonadvancing inputs refuse.
 */
export function test_motions_posture_freedom_choice_turns(): void {
  // 1. The enumeration.
  TestValidator.equals(
    "the right side first",
    HumanFreedomChoice.turns(45, "right"),
    [0, 45, -45, 90, -90, 135, -135, 180],
  );
  TestValidator.equals(
    "the left side first",
    HumanFreedomChoice.turns(45, "left"),
    [0, -45, 45, -90, 90, -135, 135, 180],
  );

  // 2. Refusals.
  TestValidator.predicate(
    "a step that does not advance is refused",
    [0, -15, 1e-300].every((step: number): boolean =>
      throwsError((): unknown => HumanFreedomChoice.turns(step, "right")),
    ),
  );

  // 3. An infinite step.
  TestValidator.equals(
    "an infinite step leaves no turn",
    HumanFreedomChoice.turns(Infinity, "right"),
    [0],
  );
}
