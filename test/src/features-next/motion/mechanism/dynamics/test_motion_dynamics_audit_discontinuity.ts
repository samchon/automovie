import { AutoMovieMotionHumanAuditContinuity } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../../../../features/internal/motionAuditPoints";
import { nclose } from "../../../../features/internal/nclose";

/**
 * The range-limited audit localizes a discontinuity to the queried interval.
 *
 * Scenarios:
 * 1. Read the public measure on the declared input and its control.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The range-limited audit localizes a discontinuity to the queried interval.
 * @evidence contracts/development/testing.md#independent-expectations The step occurs inside frame interval sixteen; the preceding interval contains only the zero branch.
 * @evidence contracts/development/testing.md#distinguishing-cases The temporal boundary distinguishes admitted and excluded observations.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_audit_discontinuity(): void {
  const step = motionAuditPoints(1, (t: number) => ({
    rightLowerArm: { x: t < 0.7031 ? 0 : 0.3, y: 1, z: 0 },
  }));
  const interior = AutoMovieMotionHumanAuditContinuity.resolve(
    step,
    "a",
    16 / 24,
    17 / 24,
    0.005,
  );
  const outside = AutoMovieMotionHumanAuditContinuity.resolve(
    step,
    "a",
    15 / 24,
    16 / 24,
    0.005,
  );
  TestValidator.predicate(
    "one interior defect",
    nclose(interior.value, 0.3, 1e-4) && interior.where === "rightLowerArm",
  );
  TestValidator.predicate(
    "adjacent clear interval",
    outside.value === 0 && outside.where === "none",
  );
}
