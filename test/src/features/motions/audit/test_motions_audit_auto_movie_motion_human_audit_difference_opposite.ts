import {
  AutoMovieMotionHumanAuditDifference
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditDifference";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditDifference.opposite` names a bone's twin on the
 * other side of the body, the midline bones their own.
 *
 * Scenarios: the left hand's twin is the right hand, the right thigh's the left
 * thigh, a left finger phalanx's the right one, and the hips are their own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names mirrored side swaps for a hand, leg and finger, and the self-paired midline hips.
 * @evidence contracts/development/testing.md#behavioral-verification Passes four concrete bone identities directly to AuditDifference.opposite and compares the returned sequence.
 * @evidence contracts/development/testing.md#independent-expectations The authored mirror pairs substitute only side while retaining the bone identity. The literal expected hips remain hips under reflection.
 */
export function test_motions_audit_auto_movie_motion_human_audit_difference_opposite(): void {
  TestValidator.equals(
    "the twins",
    [
      AutoMovieMotionHumanAuditDifference.opposite("leftHand"),
      AutoMovieMotionHumanAuditDifference.opposite("rightUpperLeg"),
      AutoMovieMotionHumanAuditDifference.opposite("leftIndexDistal"),
      AutoMovieMotionHumanAuditDifference.opposite("hips"),
    ],
    ["rightHand", "leftUpperLeg", "rightIndexDistal", "hips"],
  );
}
