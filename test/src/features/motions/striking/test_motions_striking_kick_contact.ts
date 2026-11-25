import { KickContact, KickForm } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The leans a kick tries (`KickContact.leans`): the preferred lean first; a
 * round kick then every lean from 5 to 40 degrees by 5, without repeating the
 * preferred one; a push kick then upright, unless upright was preferred.
 *
 * Scenario: a round kick preferring 15 tries 15, 5, 10, 20, ..., 40; with no
 * preference 5 to 40; a push kick preferring 10 tries 10 then 0, preferring 0
 * only 0, and with none only 0.
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
