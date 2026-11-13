import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity,
  type IAutoMovieMotionHumanAuditMeasure,
  type IAutoMovieMotionHumanAuditMotion,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../internal/motionAuditPoints";

/**
 * The continuity audit on a discontinuity: the defect of an elbow that an
 * inverse-kinematics fit flips to its other branch between two frames, which
 * the hand-to-face raise once showed as a 300 to 450 mm elbow jump.
 *
 * The film is one second long. A forearm drifts at 0.2 m/s along x, and at
 * 0.7031 s, between the 24 Hz frames 16 and 17, it steps 0.3 m up.
 *
 * Scenarios:
 * 1. The jump reads the step: 0.3 m within the 0.2 m/s drift over the final
 *    interval (under 0.1 mm), on the forearm, and its second lies within one
 *    final interval, `1 / (24 * 4^5)` s, before the step.
 * 2. The speed reads the frame pair that spans the step: `hypot(0.2 / 24,
 *    0.3) * 24 = 7.203` m/s at frame 16, 0.6667 s.
 * 3. The step stays where it went, so it is no reversal.
 * 4. A 2 mm step is below the 5 mm limit: it is not resolved and the jump
 *    reads zero; with the limit set to 1 mm the same step reads 2 mm.
 * 5. Two bones step in the same interval, the hand by 0.1 m and the forearm
 *    by 0.3 m: the worse one is reported.
 * 6. A step exactly on a frame (at 0.5 s) is found as well: 0.3 m.
 * 7. A small flip beside a fast limb is not hidden: while the hand travels
 *    at 8 m/s (333 mm a frame), the forearm steps 30 mm at 0.7031 s; the
 *    jump reads the forearm's 30 mm, not the hand's travel.
 * 8. `resolve` on one interval alone: the interval 0.6667 to 0.7083 s reads
 *    the 0.3 m step; the interval before it, which holds no step, reads zero
 *    at `none`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public measure on a path with an injected step; a jump averaged away over the frame interval, located in the wrong second or blamed on the wrong bone fails.
 * @evidence contracts/development/testing.md#independent-expectations The step's size and second are written into the path; the speed is the frame pair's displacement by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A step between frames and on a frame, above and below the limit, alone and beside a smaller one.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on hand-made joint centres. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Names the defect, the film and the 8 scenarios with their numbers.
 */
export function test_motion_audit_continuity_jump(): void {
  const stepped = (
    seconds: number,
    forearm: number,
    hand: number = 0,
  ): IAutoMovieMotionHumanAuditMotion =>
    motionAuditPoints(
      1,
      (
        t: number,
      ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> => ({
        hips: { x: 0, y: 1, z: 0 },
        rightLowerArm: {
          x: 0.2 * t,
          y: 1.2 + (t >= seconds ? forearm : 0),
          z: 0,
        },
        rightHand: { x: 0.2 * t, y: 1 + (t >= seconds ? hand : 0), z: 0.2 },
      }),
    );
  const final: number =
    1 / (24 * 4 ** AutoMovieMotionHumanAuditContinuity.LEVELS);

  const flip: AutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(stepped(0.7031, 0.3), "a");
  TestValidator.predicate(
    "the jump is the step",
    Math.abs(flip.jump.value - 0.3) <= 1e-4 &&
      flip.jump.where === "rightLowerArm",
  );
  TestValidator.predicate(
    "the jump is located within one final interval",
    flip.jump.seconds <= 0.7031 && 0.7031 - flip.jump.seconds <= final + 1e-12,
  );
  TestValidator.predicate(
    "the speed is the stepping frame pair's",
    Math.abs(flip.speed.value - Math.hypot(0.2 / 24, 0.3) * 24) <= 1e-9 &&
      Math.abs(flip.speed.seconds - 16 / 24) <= 1e-9 &&
      flip.speed.where === "rightLowerArm",
  );
  TestValidator.equals("a step is no reversal", flip.reversal.value, 0);

  TestValidator.equals(
    "a step below the limit is not resolved",
    AutoMovieMotionHumanAuditContinuity.measure(stepped(0.7031, 0.002), "a")
      .jump.value,
    0,
  );
  TestValidator.predicate(
    "a tighter limit resolves it",
    Math.abs(
      AutoMovieMotionHumanAuditContinuity.measure(
        stepped(0.7031, 0.002),
        "a",
        24,
        0.001,
      ).jump.value - 0.002,
    ) <= 1e-4,
  );

  const both: AutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(stepped(0.7031, 0.3, 0.1), "a");
  TestValidator.predicate(
    "the worse of two stepping bones is reported",
    Math.abs(both.jump.value - 0.3) <= 1e-4 &&
      both.jump.where === "rightLowerArm",
  );

  const onFrame: AutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(stepped(0.5, 0.3), "a");
  TestValidator.predicate(
    "a step on a frame is found",
    Math.abs(onFrame.jump.value - 0.3) <= 1e-4,
  );

  const hidden: AutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(
      motionAuditPoints(
        1,
        (
          t: number,
        ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> => ({
          rightLowerArm: { x: 0, y: 1.2 + (t >= 0.7031 ? 0.03 : 0), z: 0 },
          rightHand: { x: 0, y: 1, z: 8 * t },
        }),
      ),
      "a",
    );
  TestValidator.predicate(
    "a small flip beside a fast limb is found",
    Math.abs(hidden.jump.value - 0.03) <= 1e-4 &&
      hidden.jump.where === "rightLowerArm",
  );

  const inside: IAutoMovieMotionHumanAuditMeasure =
    AutoMovieMotionHumanAuditContinuity.resolve(
      stepped(0.7031, 0.3),
      "a",
      16 / 24,
      17 / 24,
      0.005,
    );
  const outside: IAutoMovieMotionHumanAuditMeasure =
    AutoMovieMotionHumanAuditContinuity.resolve(
      stepped(0.7031, 0.3),
      "a",
      15 / 24,
      16 / 24,
      0.005,
    );
  TestValidator.predicate(
    "resolve reads the interval that holds the step",
    Math.abs(inside.value - 0.3) <= 1e-4 && inside.where === "rightLowerArm",
  );
  TestValidator.predicate(
    "resolve reads nothing in a continuous interval",
    outside.value === 0 && outside.where === "none",
  );
}
