import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity,
  type IAutoMovieMotionHumanAuditMotion,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../internal/motionAuditPoints";

/**
 * The continuity audit on continuous motion: it reads the speed the path
 * has, calls nothing a jump, and reads a turnaround as the small reversal it
 * is.
 *
 * Scenarios:
 * 1. A hand swings on `x = 0.3 sin(pi t)` metres for 2 s beside a still
 *    hip. Its peak speed is `0.3 pi = 0.942` m/s at 0, 1 and 2 s; the fastest
 *    24 Hz interval touches a peak and averages `0.3 sin(pi / 24) * 24 =
 *    0.9398` m/s, so the speed reads that, on the hand. The path has no
 *    discontinuity, so the jump stays below the 5 mm limit. At its turnaround
 *    at 0.5 s the hand comes in and goes out by `0.3 (1 - cos(pi / 24)) =
 *    2.566` mm, which is the reversal.
 * 2. A hand reaches 0.6 m in 0.25 s on a minimum-jerk profile (peak speed
 *    `1.875 * 0.6 / 0.25 = 4.5` m/s), then rests. It is fast and its 24 Hz
 *    displacements change by tens of millimetres, but it is continuous: the
 *    jump stays below 5 mm, the speed reads between 4 and 4.5 m/s, and a
 *    path that never turns back reads no reversal.
 * 3. A hand that turns a right angle (0.05 m along x, then 0.05 m along z)
 *    reads no reversal: the two displacements do not oppose.
 * 4. A motion of zero length reads nothing: every measure is zero at `none`.
 * 5. A motion shorter than one grid interval (10 ms, 5 mm travelled) reads
 *    its speed over its own length, 0.5 m/s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public measure on closed-form paths; a speed read over the wrong interval, a continuous reach called a jump or a turnaround inflated fails.
 * @evidence contracts/development/testing.md#independent-expectations Speeds, the turnaround and the minimum-jerk peak are the paths' own closed forms.
 * @evidence contracts/development/testing.md#distinguishing-cases A slow swing, a fast reach, a right-angle turn, an empty motion and a motion under one interval.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on hand-made joint centres. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned and lists the 5 scenarios with their numbers.
 */
export function test_motion_audit_continuity_smooth(): void {
  const at = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const measure = (
    motion: IAutoMovieMotionHumanAuditMotion,
  ): AutoMovieMotionHumanAuditContinuity.IResult =>
    AutoMovieMotionHumanAuditContinuity.measure(motion, "a");

  const swing: AutoMovieMotionHumanAuditContinuity.IResult = measure(
    motionAuditPoints(2, (t: number) => ({
      hips: at(0, 1, 0),
      rightHand: at(0.3 * Math.sin(Math.PI * t), 1, 0.3),
    })),
  );
  TestValidator.predicate(
    "the swing's speed is its fastest interval's",
    Math.abs(swing.speed.value - 0.3 * Math.sin(Math.PI / 24) * 24) <= 1e-9 &&
      swing.speed.where === "rightHand",
  );
  TestValidator.predicate("the swing has no jump", swing.jump.value < 0.005);
  TestValidator.predicate(
    "the swing's turnaround is its reversal",
    Math.abs(swing.reversal.value - 0.3 * (1 - Math.cos(Math.PI / 24))) <=
      1e-9 && swing.reversal.where === "rightHand",
  );

  const jerk = (u: number): number =>
    u >= 1 ? 1 : 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5;
  const reach: AutoMovieMotionHumanAuditContinuity.IResult = measure(
    motionAuditPoints(1, (t: number) => ({
      rightHand: at(0, 1, 0.6 * jerk(t / 0.25)),
    })),
  );
  TestValidator.predicate(
    "a fast reach is not a jump",
    reach.jump.value < 0.005,
  );
  TestValidator.predicate(
    "a fast reach reads its speed",
    reach.speed.value > 4 && reach.speed.value <= 4.5 + 1e-9,
  );
  TestValidator.equals("a reach never turns back", reach.reversal.value, 0);

  const corner: AutoMovieMotionHumanAuditContinuity.IResult = measure(
    motionAuditPoints(2 / 24, (t: number) => ({
      rightHand:
        t < 1.5 / 24 ? at(0.05 * Math.min(1, t * 24), 1, 0) : at(0.05, 1, 0.05),
    })),
  );
  TestValidator.equals(
    "a right angle is no reversal",
    corner.reversal.value,
    0,
  );

  const empty: AutoMovieMotionHumanAuditContinuity.IResult = measure(
    motionAuditPoints(0, () => ({ hips: at(0, 1, 0) })),
  );
  TestValidator.predicate(
    "an empty motion reads nothing",
    empty.jump.value === 0 &&
      empty.jump.where === "none" &&
      empty.reversal.value === 0 &&
      empty.reversal.where === "none" &&
      empty.speed.value === 0 &&
      empty.speed.where === "none",
  );

  const brief: AutoMovieMotionHumanAuditContinuity.IResult = measure(
    motionAuditPoints(0.01, (t: number) => ({ hips: at(0.5 * t, 1, 0) })),
  );
  TestValidator.predicate(
    "a motion under one interval reads its speed over its own length",
    Math.abs(brief.speed.value - 0.5) <= 1e-9,
  );
}
