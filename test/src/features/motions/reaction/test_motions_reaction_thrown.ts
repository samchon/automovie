import {
  thrown
} from "../../../../../packages/motions/src/reaction/internal/thrown";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * The `thrown` law's admission (`thrown.admit`): a throw rises and travels a
 * positive height and distance, and the body lies a non-negative time after.
 *
 * Scenario: a 3 m throw rising 1 m and lying 1 s is admitted; no travel, no
 * rise or a negative lie is refused.
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
