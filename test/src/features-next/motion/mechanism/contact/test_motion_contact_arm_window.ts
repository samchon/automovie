import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanTarget,
  HumanHand,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/**
 * A planned reach whose hand stays on its site to the end of the action
 * (`relax` at `end`) is planned and written to the end, its last waypoint
 * solved on the site rather than pinned to a return.
 *
 * Scenario: the average man's right hand reaches from the quiet stance onto
 * a place ahead at waist height over 0.8 s and stays there until 1.5 s. Every
 * written second to the end is finite; the palm moves no farther between two
 * frames than the audit's travel bound allows; and from `ready` to the end,
 * the last frame included, the palm lies within 11 mm of its place: the
 * planner's 10 mm site disc and a millimetre.
 *
 * Scenarios:
 * 1. Read the real carried palm through a held endpoint whose return duration is zero.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepares and writes the real carried arm and reads the palm on the resolved pose; a NaN instant, a jump at the end or a hand pulled off its site to a return fails.
 * @evidence contracts/development/testing.md#independent-expectations The place is stated here, the bound on a frame's travel is the audit's 80 mm per twenty-fourth of a second, and the disc is the planner's stated 10 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases The reach, the hold and the end instant itself, which is where an empty return interval used to put a NaN.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the scenario and its three bounds.
 */
export function test_motion_contact_arm_window(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const quiet: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const side: AutoMovieHumanSide = "right";
  const place = {
    point: { x: -0.2, y: 0.95, z: 0.4 },
    normal: { x: 0, y: 1, z: 0 },
  };
  const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanArm.goal(
    body,
    side,
    AutoMovieMotionHumanTarget.hand(body, quiet, side, place, {
      bend: "front",
    }),
  );
  const span = { start: 0, ready: 0.8, relax: 1.5, end: 1.5 };
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body,
    side,
    from: span.start,
    to: span.end,
    rest: AutoMovieMotionHumanArm.angles(
      resolveHumanPosture(body, quiet),
      side,
    ),
    goal: (): IAutoMovieHumanLimbGoal => goal,
    weight: (seconds: number): number => Math.min(1, seconds / span.ready),
    span,
  });
  const before = (): IAutoMovieMotionHumanPosture => quiet;
  arm.prepare!(before);
  const palm = (seconds: number): IAutoMovieVector3 =>
    HumanHand.frame(
      body,
      poseBones(
        body,
        resolveHumanPosture(body, arm.write(quiet, seconds, before)),
      ),
      side,
      "palm",
      "flat",
    ).point;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const initial = HumanHand.frame(
    body,
    poseBones(body, resolveHumanPosture(body, quiet)),
    side,
    "palm",
    "flat",
  ).point;
  TestValidator.predicate(
    "zero reach weight preserves the incoming palm",
    distance(palm(span.start), initial) <= 0.001,
  );
  TestValidator.predicate(
    "zero return duration preserves the held endpoint",
    distance(palm(span.relax), palm(span.end)) <= 1e-9,
  );
  const frames: number = Math.round(span.end * 30);
  const read: IAutoMovieVector3[] = Array.from(
    { length: frames + 1 },
    (_: unknown, i: number): IAutoMovieVector3 => palm((span.end * i) / frames),
  );
  TestValidator.predicate(
    "every second to the end is finite",
    read.every(
      (p: IAutoMovieVector3): boolean =>
        Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z),
    ),
  );
  const step: number = Math.max(
    ...read
      .slice(1)
      .map((p: IAutoMovieVector3, i: number): number => distance(p, read[i]!)),
  );
  TestValidator.predicate(
    `the palm's largest step between frames, ${(step * 1000).toFixed(1)} mm, is within the audit's travel bound`,
    step <= (0.08 * 24) / 30,
  );
  const off: number = Math.max(
    ...read
      .filter(
        (_: IAutoMovieVector3, i: number): boolean =>
          (span.end * i) / frames >= span.ready,
      )
      .map((p: IAutoMovieVector3): number => distance(p, place.point)),
  );
  TestValidator.predicate(
    `the palm stays within ${(off * 1000).toFixed(1)} mm of its place from ready to the end`,
    off <= 0.011,
  );
}
