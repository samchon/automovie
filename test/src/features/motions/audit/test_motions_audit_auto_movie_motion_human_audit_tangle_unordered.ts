import {
  AutoMovieMotionHumanAuditTangle
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditTangle";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditTangle.unordered` keys a pair of bones the same
 * whichever comes first: the two names in code-unit order, joined by `|`.
 *
 * Scenarios: the hand and the chest key `chest|leftHand` in either order; a
 * bone paired with itself keys its name twice.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names reversed pair order and repetition of one bone paired with itself.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AuditTangle.unordered with both permutations and a duplicate bone, comparing their complete keys.
 * @evidence contracts/development/testing.md#independent-expectations Code-unit order puts chest before leftHand in either input order. A pair of identical head names keeps both occurrences with the separator between them.
 */
export function test_motions_audit_auto_movie_motion_human_audit_tangle_unordered(): void {
  TestValidator.equals(
    "either order",
    [
      AutoMovieMotionHumanAuditTangle.unordered("leftHand", "chest"),
      AutoMovieMotionHumanAuditTangle.unordered("chest", "leftHand"),
      AutoMovieMotionHumanAuditTangle.unordered("head", "head"),
    ],
    ["chest|leftHand", "chest|leftHand", "head|head"],
  );
}
