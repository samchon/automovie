import { AutoMovieMotionHumanAuditContinuity } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../../../../features/internal/motionAuditPoints";
import { nclose } from "../../../../features/internal/nclose";

/**
 * The motion audit distinguishes continuous speed from a one-frame reversal.
 *
 * Scenarios:
 * 1. Read the public measure on the declared input and its control.
 * 2. Speed is the body's own: a still pose carried at a freefall's 53 m/s
 *    reads no speed, and a hand moving 31 m/s against still hips reads it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The motion audit distinguishes continuous speed from a one-frame reversal.
 * @evidence contracts/development/testing.md#independent-expectations A linear two-metre-per-second marker has constant speed; an eight-centimetre impulse returns by exactly eight centimetres; a body translated whole moves no joint against its hips.
 * @evidence contracts/development/testing.md#distinguishing-cases The temporal boundary distinguishes admitted and excluded observations.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_audit_velocity(): void {
  const read = (path: (t: number) => number) =>
    AutoMovieMotionHumanAuditContinuity.measure(
      motionAuditPoints(1, (t: number) => ({
        rightHand: { x: path(t), y: 1, z: 0 },
      })),
      "a",
    );
  const smooth = read((t) => 2 * t);
  TestValidator.predicate(
    "uniform hand speed",
    nclose(smooth.speed.value, 2) &&
      smooth.jump.value === 0 &&
      smooth.reversal.value === 0,
  );
  const spike = read((t) => (Math.abs(t - 0.5) < 1 / 48 ? 0.08 : 0));
  TestValidator.predicate(
    "visible reversal",
    nclose(spike.reversal.value, 0.08) && nclose(spike.reversal.seconds, 0.5),
  );

  // The body's bulk motion is not a limb's speed.
  const carried = AutoMovieMotionHumanAuditContinuity.measure(
    motionAuditPoints(1, (t: number) => ({
      hips: { x: 0, y: 1000 - 53 * t, z: 0 },
      rightHand: { x: 0.3, y: 1001 - 53 * t, z: 0 },
    })),
    "a",
  );
  TestValidator.predicate(
    "a still pose falling at 53 m/s reads no speed",
    nclose(carried.speed.value, 0),
  );
  const flung = AutoMovieMotionHumanAuditContinuity.measure(
    motionAuditPoints(1, (t: number) => ({
      hips: { x: 0, y: 1, z: 0 },
      rightHand: { x: 31 * t, y: 1, z: 0 },
    })),
    "a",
  );
  TestValidator.predicate(
    "a hand at 31 m/s against still hips reads over 30",
    flung.speed.value >= 30,
  );
}
