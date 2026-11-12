import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditContinuity } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../internal/motionAuditPoints";

/**
 * The continuity audit on an out-and-back spike: the defect of a fit that
 * takes its other branch for one frame and returns, which no speed bound
 * reads where both displacements are plausible speeds.
 *
 * The reversal of two successive 24 Hz displacements `a` and `b` is how far
 * the joint comes back along the way it went: `-a.b / max(|a|, |b|)`, zero
 * when they do not oppose. The film is one second long and an elbow rests
 * beside a still hip unless stated.
 *
 * Scenarios:
 * 1. The elbow sits 80 mm higher on frame 10 alone (from 0.4 to 0.4333 s):
 *    it goes 80 mm out and 80 mm back, so the reversal reads 80 mm at
 *    frame 10, 0.4167 s, on the elbow; the two steps that make it are an 80
 *    mm jump.
 * 2. The elbow goes 80 mm out and comes 30 mm back, staying 50 mm up: the
 *    reversal is the shorter way, 30 mm.
 * 3. A hand travels 60 mm along x and then 60 mm at 120 degrees to that
 *    heading: the displacements oppose by `cos 120 = -1/2`, so the reversal
 *    reads 30 mm at the turn, frame 1.
 * 4. A hand on a straight line at constant speed reads no reversal.
 * 5. The hand spikes 20 mm while the elbow spikes 80 mm on the same frame:
 *    the worse one, the elbow, is reported.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public measure on paths with an injected spike; a spike read as its outward distance when it returns less, missed because each step is slow, or blamed on another bone fails.
 * @evidence contracts/development/testing.md#independent-expectations Each reversal is the scalar product of the two written displacements over the longer one, by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A full return, a partial return, an oblique turn, no turn, and two bones.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on hand-made joint centres. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the measure and lists the 5 scenarios with their numbers.
 */
export function test_motion_audit_continuity_reversal(): void {
  const frame: number = 10 / 24;
  const half: number = 0.4 / 24;
  const lifted = (
    elbow: (seconds: number) => number,
    hand: (seconds: number) => number = (): number => 0,
  ): AutoMovieMotionHumanAuditContinuity.IResult =>
    AutoMovieMotionHumanAuditContinuity.measure(
      motionAuditPoints(
        1,
        (
          t: number,
        ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> => ({
          hips: { x: 0, y: 1, z: 0 },
          rightLowerArm: { x: 0.3, y: 1.2 + elbow(t), z: 0 },
          rightHand: { x: 0.3, y: 1 + hand(t), z: 0.2 },
        }),
      ),
      "a",
    );
  const spike =
    (height: number): ((seconds: number) => number) =>
    (t: number): number =>
      Math.abs(t - frame) < half ? height : 0;

  const full: AutoMovieMotionHumanAuditContinuity.IResult = lifted(spike(0.08));
  TestValidator.predicate(
    "a one-frame spike is its own height",
    Math.abs(full.reversal.value - 0.08) <= 1e-9 &&
      Math.abs(full.reversal.seconds - frame) <= 1e-9 &&
      full.reversal.where === "rightLowerArm",
  );
  TestValidator.predicate(
    "the spike's steps are a jump",
    Math.abs(full.jump.value - 0.08) <= 1e-4 &&
      full.jump.where === "rightLowerArm",
  );

  const partial: AutoMovieMotionHumanAuditContinuity.IResult = lifted(
    (t: number): number =>
      t < frame - half ? 0 : t < frame + half ? 0.08 : 0.05,
  );
  TestValidator.predicate(
    "a partial return is the shorter way",
    Math.abs(partial.reversal.value - 0.03) <= 1e-9 &&
      Math.abs(partial.reversal.seconds - frame) <= 1e-9,
  );

  const turn: AutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(
      motionAuditPoints(
        2 / 24,
        (
          t: number,
        ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> => {
          const first: number = Math.min(1, t * 24);
          const second: number = Math.max(0, t * 24 - 1);
          return {
            rightHand: {
              x: 0.06 * first + 0.06 * Math.cos((2 * Math.PI) / 3) * second,
              y: 1,
              z: 0.06 * Math.sin((2 * Math.PI) / 3) * second,
            },
          };
        },
      ),
      "a",
    );
  TestValidator.predicate(
    "an oblique turn is its opposing part",
    Math.abs(turn.reversal.value - 0.03) <= 1e-9 &&
      Math.abs(turn.reversal.seconds - 1 / 24) <= 1e-9 &&
      turn.reversal.where === "rightHand",
  );

  const line: AutoMovieMotionHumanAuditContinuity.IResult =
    AutoMovieMotionHumanAuditContinuity.measure(
      motionAuditPoints(
        1,
        (
          t: number,
        ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> => ({
          rightHand: { x: 0.5 * t, y: 1, z: 0 },
        }),
      ),
      "a",
    );
  TestValidator.predicate(
    "a straight line is no reversal",
    line.reversal.value === 0 && line.reversal.where === "none",
  );

  const both: AutoMovieMotionHumanAuditContinuity.IResult = lifted(
    spike(0.08),
    spike(0.02),
  );
  TestValidator.predicate(
    "the worse of two spiking bones is reported",
    Math.abs(both.reversal.value - 0.08) <= 1e-9 &&
      both.reversal.where === "rightLowerArm",
  );
}
