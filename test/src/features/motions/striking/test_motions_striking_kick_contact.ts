import {
  KickContact
} from "../../../../../packages/motions/src/striking/internal/KickContact";
import {
  KickForm
} from "../../../../../packages/motions/src/striking/internal/KickForm";
import { TestValidator } from "@nestia/e2e";

/**
 * The leans a kick tries (`KickContact.leans`): the preferred lean first; a
 * round kick then every lean from 5 to 40 degrees by 5, without repeating the
 * preferred one; a push kick then upright, unless upright was preferred.
 *
 * Scenario: a round kick preferring 15 tries 15, 5, 10, 20, ..., 40; with no
 * preference 5 to 40; a push kick preferring 10 tries 10 then 0, preferring 0
 * only 0, and with none only 0.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the numerical lean trial order and duplicate elimination for two animation variants.
 * @evidence contracts/development/testing.md#behavioral-verification Enumerates fallback leans with preferred, absent and exact zero preferences and reads the pose range case.
 * @evidence contracts/development/testing.md#independent-expectations The 5-degree grid from 5 to 40 excludes the first preferred sample. An upright-only fallback adds zero exactly once.
 */
export function test_motions_striking_kick_contact(): void {
  TestValidator.equals(
    "the leans",
    [
      KickContact.leans("round", 15),
      KickContact.leans("round", undefined),
      KickContact.leans("push", 10),
      KickContact.leans("push", 0),
      KickContact.leans("push", undefined),
    ],
    [
      [15, 5, 10, 20, 25, 30, 35, 40],
      [5, 10, 15, 20, 25, 30, 35, 40],
      [10, 0],
      [0],
      [0],
    ],
  );
  TestValidator.equals(
    "the range",
    [KickForm.LEAN_LEAST, KickForm.LEAN_MOST, KickForm.LEAN_STEP],
    [5, 40, 5],
  );
}
