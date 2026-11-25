import { groupDance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * The `groupDance` law's count (`groupDance.count`): four beats a conga repeat,
 * eight a line or circle repeat, one repeat and a 0.02 s variation by default.
 *
 * Scenarios:
 *
 * 1. Two conga repeats are eight beats; one line is eight, varying 0.02 s.
 * 2. 1.5 repeats round to two, 16 line beats; a negative variation, or repeats
 *    rounding to none, are refused.
 */
export function test_unit_motions_exercise_group_dance(): void {
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
