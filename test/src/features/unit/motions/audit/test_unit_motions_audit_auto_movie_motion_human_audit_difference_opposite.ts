import { AutoMovieMotionHumanAuditDifference } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditDifference.opposite` names a bone's twin on the
 * other side of the body, the midline bones their own.
 *
 * Scenarios: the left hand's twin is the right hand, the right thigh's the left
 * thigh, a left finger phalanx's the right one, and the hips are their own.
 */
export function test_unit_motions_audit_auto_movie_motion_human_audit_difference_opposite(): void {
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
