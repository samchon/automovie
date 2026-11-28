import {
  AutoMovieMotionHumanAuditTangleModel
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditTangleModel";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditTangleModel.group` names the part a bone belongs to
 * where several bones are one part: a hand with its fingers, a foot with its
 * toes; any other bone is its own part.
 *
 * Scenarios: a left index phalanx and the left hand are the left hand; the
 * right toes are the right foot; the right forearm and the head are their own.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names finger and toe group aliases and unchanged forearm and head.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AuditTangleModel.group on five explicit bone names and compares the returned body-part identities.
 * @evidence contracts/development/testing.md#independent-expectations The literal mapping groups a left finger with the left hand and the right toes with the right foot. The head and right forearm are their own groups.
 */
export function test_motions_audit_auto_movie_motion_human_audit_tangle_model_group(): void {
  TestValidator.equals(
    "the parts",
    [
      AutoMovieMotionHumanAuditTangleModel.group("leftIndexDistal"),
      AutoMovieMotionHumanAuditTangleModel.group("leftHand"),
      AutoMovieMotionHumanAuditTangleModel.group("rightToes"),
      AutoMovieMotionHumanAuditTangleModel.group("rightLowerArm"),
      AutoMovieMotionHumanAuditTangleModel.group("head"),
    ],
    ["leftHand", "leftHand", "rightFoot", "rightLowerArm", "head"],
  );
}
