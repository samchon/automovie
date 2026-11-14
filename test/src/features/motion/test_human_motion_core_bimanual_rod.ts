import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanTarget,
  HumanHand,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Two hands on one rod are planned as one problem whose grasp is an allowed
 * contact: each hand's site is the rod's pose times its grip, so the chain
 * closes through the rod, and the two hands that meet on it are not read as
 * colliding.
 *
 * Scenario: the average man lays both palms side by side, 6 cm apart, on a
 * rod held across his body ahead at waist height, from the quiet stance
 * over 0.6 s, then lifts the rod 0.15 m with both hands between 0.65 s
 * and 1.05 s and lets go by 1.5 s, each hand held to a 4 mm disc about its
 * grip (`ICarry.disc`), both declaring their hands and forearms as the grasp
 * (`ICarry.grasp`): every frame at 60 a second is finite, each palm moves
 * within the audit's travel bound, each lies within 5 mm of its place on
 * the rod over the hold, and the two palms keep their spacing within 5 mm.
 * The same rod undeclared is refused
 * (`test_human_motion_core_bimanual_rod_undeclared`).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans and writes two real carried arms and reads the palms on the resolved pose; a grasp read as a collision, a hand that drifts off its grip or a jump fails.
 * @evidence contracts/development/testing.md#independent-expectations The rod, its lift and the hands' places are written here; the travel bound is the audit's 80 mm per twenty-fourth of a second and the disc the 4 mm stated.
 * @evidence contracts/development/testing.md#distinguishing-cases The declared half of a pair whose undeclared half is refused in its own spec; the reach, the lift and the release.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the scenario and its bounds.
 */
export function test_human_motion_core_bimanual_rod(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const quiet: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const span = { start: 0, ready: 0.6, relax: 1.1, end: 1.5 };
  const lift = (seconds: number): number => {
    const s: number = Math.min(1, Math.max(0, (seconds - 0.65) / 0.4));
    return 0.15 * s * s * s * (10 - 15 * s + 6 * s * s);
  };
  const place = (side: HumanHand.Side, seconds: number): IAutoMovieVector3 => ({
    x: side === "left" ? 0.03 : -0.03,
    y: 1.0 + lift(seconds),
    z: 0.35,
  });
  const goal =
    (side: HumanHand.Side) =>
    (_: IHumanPosture, seconds: number): IHumanPosture.IGoal =>
      AutoMovieMotionHumanArm.goal(
        body,
        side,
        AutoMovieMotionHumanTarget.hand(
          body,
          quiet,
          side,
          { point: place(side, seconds), normal: { x: 0, y: 1, z: 0 } },
          { forward: { x: 0, y: 0, z: 1 } },
        ),
      );
  const arms = (): IAutoMovieMotionHumanPrimitive[] => {
    const together = AutoMovieMotionHumanArm.together();
    return (["right", "left"] as const).map(
      (side: HumanHand.Side): IAutoMovieMotionHumanPrimitive =>
        AutoMovieMotionHumanArm.carried({
          body,
          side,
          from: span.start,
          to: span.end,
          rest: AutoMovieMotionHumanArm.angles(
            resolveHumanPosture(body, quiet),
            side,
          ),
          goal: goal(side),
          weight: (): number => 0,
          span,
          together,
          disc: 0.004,
          grasp: ["hand", "lowerArm"],
        }),
    );
  };
  const before = (): IHumanPosture => quiet;

  const held: IAutoMovieMotionHumanPrimitive[] = arms();
  held[0]!.prepare!(before);
  const palms = (
    seconds: number,
  ): Record<HumanHand.Side, IAutoMovieVector3> => {
    const posture: IHumanPosture = held.reduce(
      (p: IHumanPosture, arm: IAutoMovieMotionHumanPrimitive): IHumanPosture =>
        arm.write(p, seconds, before),
      quiet,
    );
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    return {
      left: HumanHand.frame(body, bones, "left", "palm", "relaxed").point,
      right: HumanHand.frame(body, bones, "right", "palm", "relaxed").point,
    };
  };
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const rate: number = 60;
  const frames: number = Math.round(span.end * rate);
  const read = Array.from({ length: frames + 1 }, (_: unknown, i: number) =>
    palms(i / rate),
  );
  TestValidator.predicate(
    "every frame is finite",
    read.every((p): boolean =>
      [p.left, p.right].every(
        (q: IAutoMovieVector3): boolean =>
          Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.z),
      ),
    ),
  );
  let step: number = 0;
  let off: number = 0;
  let spacing: number = 0;
  read.forEach((p, i: number): void => {
    const seconds: number = i / rate;
    if (i > 0)
      step = Math.max(
        step,
        distance(p.left, read[i - 1]!.left),
        distance(p.right, read[i - 1]!.right),
      );
    if (seconds >= span.ready && seconds <= span.relax) {
      off = Math.max(
        off,
        distance(p.left, place("left", seconds)),
        distance(p.right, place("right", seconds)),
      );
      spacing = Math.max(spacing, Math.abs(distance(p.left, p.right) - 0.06));
    }
  });
  TestValidator.predicate(
    `the palms' largest step between frames, ${(step * 1000).toFixed(1)} mm, is within the audit's travel bound`,
    step <= (0.08 * 24) / rate,
  );
  TestValidator.predicate(
    `the palms stay within ${(off * 1000).toFixed(1)} mm of their places over the hold`,
    off <= 0.005,
  );
  TestValidator.predicate(
    `the palms keep their spacing within ${(spacing * 1000).toFixed(1)} mm`,
    spacing <= 0.005,
  );
}
