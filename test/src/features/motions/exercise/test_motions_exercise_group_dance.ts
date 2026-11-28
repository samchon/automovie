import {
  groupDance
} from "../../../../../packages/motions/src/exercise/internal/groupDance";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * The `groupDance` law's count (`groupDance.count`): four beats a conga repeat,
 * eight a line or circle repeat, one repeat and a 0.02 s variation by default.
 *
 * Scenarios:
 *
 * 1. Two conga repeats are eight beats; one line is eight, varying 0.02 s.
 * 2. 1.5 repeats round to two, 16 line beats; a negative variation, or repeats
 *    rounding to none, are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Conga and line phrases count beats by their own repeat lengths, with explicit rounding and variation admission.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the repeat counter for named rhythms, fractional counts, and invalid counts or variation.
 * @evidence contracts/development/testing.md#independent-expectations Four or eight beats per repeat determine the expected totals. Rounding 1.5 repeats yields two while a count rounding to zero is refused.
 */
export function test_motions_exercise_group_dance(): void {
  TestValidator.equals(
    "the counts",
    [
      groupDance.count({ kind: "conga", repeats: 2 }),
      groupDance.count({ kind: "line" }),
    ],
    [
      { repeats: 2, vary: 0.02, counts: 8 },
      { repeats: 1, vary: 0.02, counts: 8 },
    ],
  );
  TestValidator.predicate(
    "out of range",
    throwsError(() => groupDance.count({ kind: "circle", vary: -1 })) &&
      throwsError(() => groupDance.count({ kind: "circle", repeats: 0.4 })) &&
      groupDance.count({ kind: "line", repeats: 1.5 }).counts === 16,
  );
}
