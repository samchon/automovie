import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity,
  type IAutoMovieMotionHumanAuditMotion,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../internal/motionAuditPoints";

/**
 * The continuity audit on the small and the late: a finger or a toe that
 * snaps, and a joint that stands still and then jumps.
 *
 * A finger's joint centre travels millimetres where an elbow travels
 * decimetres, so a snap of a finger is the defect most easily lost beside a
 * limb, and a joint that waits and then jumps has no motion around its step
 * to compare it with. Each film is one second long with the hips at rest.
 *
 * Scenarios:
 * 1. A fingertip that steps 8 mm at 0.4321 s while nothing else moves reads
 *    a jump of 8 mm on `leftIndexDistal`, located within one final interval
 *    before the step.
 * 2. A toe that steps 6 mm at 0.61 s reads 6 mm on `rightToes`.
 * 3. A fingertip that steps 8 mm while the wrist beside it sweeps at 3 m/s
 *    still reads the fingertip's 8 mm.
 * 4. A wrist that holds still for 0.8 s and then steps 40 mm at 0.8125 s
 *    reads 40 mm: the stall before it hides nothing.
 * 5. A wrist that holds still and then leaves smoothly, from rest with a
 *    constant 4 m/s² from 0.5 s, reads no jump.
 * 6. A thumb tip that steps 4 mm, below the 5 mm limit, reads none, and
 *    reads 4 mm when the limit is 2 mm.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public measure on films with a written step; a digit not followed, a step lost beside a limb or after a stall, or a smooth start taken for a step fails.
 * @evidence contracts/development/testing.md#independent-expectations Each step's size, bone and second are written into the film.
 * @evidence contracts/development/testing.md#distinguishing-cases A finger, a toe, a finger beside a fast wrist, a stall then a step, a stall then a smooth start, and a step on either side of the limit.
 * @evidence contracts/development/testing.md#execution-ownership In memory on hand-made joint centres; no body is prepared.
 * @evidence contracts/development/common.md#meaningful-documentation Names the defects, the films and the 6 scenarios with their numbers.
 */
export function test_motion_audit_continuity_digits(): void {
  type Points = Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>>;
  const film = (at: (t: number) => Points): IAutoMovieMotionHumanAuditMotion =>
    motionAuditPoints(
      1,
      (t: number): Points => ({ hips: { x: 0, y: 1, z: 0 }, ...at(t) }),
    );
  const final: number =
    1 / (24 * 4 ** AutoMovieMotionHumanAuditContinuity.LEVELS);
  const read = (
    at: (t: number) => Points,
    limit: number = 0.005,
  ): AutoMovieMotionHumanAuditContinuity.IResult =>
    AutoMovieMotionHumanAuditContinuity.measure(film(at), "a", 24, limit);
  const show = (r: AutoMovieMotionHumanAuditContinuity.IResult): string =>
    `${(r.jump.value * 1000).toFixed(3)} mm at ${r.jump.seconds.toFixed(5)} s on ${r.jump.where}`;
  const step = (t: number, at: number, size: number): number =>
    t >= at ? size : 0;

  // 1. A fingertip.
  const finger: AutoMovieMotionHumanAuditContinuity.IResult = read(
    (t: number): Points => ({
      leftHand: { x: 0.3, y: 1, z: 0 },
      leftIndexDistal: { x: 0.38, y: 1 - step(t, 0.4321, 0.008), z: 0 },
    }),
  );
  TestValidator.predicate(
    `a fingertip's 8 mm snap is read, got ${show(finger)}`,
    Math.abs(finger.jump.value - 0.008) <= 1e-6 &&
      finger.jump.where === "leftIndexDistal" &&
      finger.jump.seconds <= 0.4321 &&
      0.4321 - finger.jump.seconds <= final + 1e-12,
  );

  // 2. A toe.
  const toe: AutoMovieMotionHumanAuditContinuity.IResult = read(
    (t: number): Points => ({
      rightFoot: { x: -0.1, y: 0.08, z: 0 },
      rightToes: { x: -0.1, y: 0.02 + step(t, 0.61, 0.006), z: 0.15 },
    }),
  );
  TestValidator.predicate(
    `a toe's 6 mm snap is read, got ${show(toe)}`,
    Math.abs(toe.jump.value - 0.006) <= 1e-6 && toe.jump.where === "rightToes",
  );

  // 3. A fingertip beside a fast wrist.
  const beside: AutoMovieMotionHumanAuditContinuity.IResult = read(
    (t: number): Points => ({
      rightHand: { x: -0.3, y: 1, z: 3 * t },
      leftIndexDistal: { x: 0.38, y: 1 - step(t, 0.4321, 0.008), z: 0 },
    }),
  );
  TestValidator.predicate(
    `a fingertip's snap beside a 3 m/s wrist is read, got ${show(beside)}`,
    Math.abs(beside.jump.value - 0.008) <= 1e-6 &&
      beside.jump.where === "leftIndexDistal",
  );

  // 4. A stall, then a step.
  const stalled: AutoMovieMotionHumanAuditContinuity.IResult = read(
    (t: number): Points => ({
      rightHand: { x: -0.3, y: 1 + step(t, 0.8125, 0.04), z: 0.2 },
    }),
  );
  TestValidator.predicate(
    `a step after a stall is read, got ${show(stalled)}`,
    Math.abs(stalled.jump.value - 0.04) <= 1e-6 &&
      stalled.jump.where === "rightHand" &&
      stalled.jump.seconds <= 0.8125 &&
      0.8125 - stalled.jump.seconds <= final + 1e-12,
  );

  // 5. A stall, then a smooth start.
  const smooth: AutoMovieMotionHumanAuditContinuity.IResult = read(
    (t: number): Points => ({
      rightHand: {
        x: -0.3,
        y: 1 + (t > 0.5 ? 2 * (t - 0.5) ** 2 : 0),
        z: 0.2,
      },
    }),
  );
  TestValidator.predicate(
    `a smooth start after a stall is no jump, got ${show(smooth)}`,
    smooth.jump.value < 0.001,
  );

  // 6. Either side of the limit.
  const thumb = (t: number): Points => ({
    leftThumbDistal: { x: 0.33, y: 1 + step(t, 0.4321, 0.004), z: 0.05 },
  });
  TestValidator.equals(
    "a 4 mm snap is below the 5 mm limit",
    read(thumb).jump.value,
    0,
  );
  const tight: AutoMovieMotionHumanAuditContinuity.IResult = read(thumb, 0.002);
  TestValidator.predicate(
    `a 2 mm limit reads the 4 mm snap, got ${show(tight)}`,
    Math.abs(tight.jump.value - 0.004) <= 1e-6 &&
      tight.jump.where === "leftThumbDistal",
  );
}
