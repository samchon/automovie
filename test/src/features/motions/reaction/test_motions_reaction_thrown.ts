import {
  thrown
} from "../../../../../packages/motions/src/reaction/internal/thrown";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Check admission of throw distance, rise and recovery hold.
 *
 * Scenarios:
 *
 * 1. Admit a throw that travels 3 m, rises 1 m and holds for 1 s after
 *    landing.
 * 2. Refuse zero travel, zero rise or a negative hold.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios state which travel, rise and hold values reach the admission boundary.
 * @evidence contracts/development/testing.md#behavioral-verification The test varies one scalar at a time around the admitted throw.
 * @evidence contracts/development/testing.md#independent-expectations The fixture sets independent positive travel and rise and compares them with zero, then varies only the hold below zero.
 */
export function test_motions_reaction_thrown(): void {
  TestValidator.predicate(
    "the throw's bounds",
    !throwsError(() => thrown.admit(3, 1, 1)) &&
      throwsError(() => thrown.admit(0, 1, 1)) &&
      throwsError(() => thrown.admit(3, 0, 1)) &&
      throwsError(() => thrown.admit(3, 1, -1)),
  );
}
