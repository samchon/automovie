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
  AutoMovieMotionHumanAudit,
  AutoMovieMotionHumanTarget,
  HumanHand,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * Two palms hold a moving rigid rod and leave it continuously.
 *
 * Scenarios:
 *
 * 1. Read the held palms at the midpoint and the four neighbouring right-palm
 *    positions around the recorded 71/60 second defect.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Two palms hold a moving rigid rod and leave it continuously.
 * @evidence contracts/development/testing.md#independent-expectations The authored grips are sixty millimetres apart. A straight local path has equal successive displacements.
 * @evidence contracts/development/testing.md#distinguishing-cases Both the held interval and the release transient are observed.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_prehension_two_grip_frame(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const quiet: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const span = { start: 0, ready: 0.6, relax: 1.1, end: 1.5 };
  const lift = (seconds: number): number => {
    const s: number = Math.min(1, Math.max(0, (seconds - 0.65) / 0.4));
    return 0.15 * s * s * s * (10 - 15 * s + 6 * s * s);
  };
  const place = (
    side: AutoMovieHumanSide,
    seconds: number,
  ): IAutoMovieVector3 => ({
    x: side === "left" ? 0.03 : -0.03,
    y: 1.0 + lift(seconds),
    z: 0.35,
  });
  const goal =
    (side: AutoMovieHumanSide) =>
    (
      _: IAutoMovieMotionHumanPosture,
      seconds: number,
    ): IAutoMovieHumanLimbGoal =>
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
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanPrimitive =>
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
          ...(side === "left" ? { on: "rightHand" as const } : {}),
        }),
    );
  };
  const before = (): IAutoMovieMotionHumanPosture => quiet;

  const held: IAutoMovieMotionHumanPrimitive[] = arms();
  held[0]!.prepare!(before);
  const palms = (
    seconds: number,
  ): Record<AutoMovieHumanSide, IAutoMovieVector3> => {
    const posture: IAutoMovieMotionHumanPosture = held.reduce(
      (
        p: IAutoMovieMotionHumanPosture,
        arm: IAutoMovieMotionHumanPrimitive,
      ): IAutoMovieMotionHumanPosture => arm.write(p, seconds, before),
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
  const hold: number = (span.ready + span.relax) / 2;
  const heldPalms = palms(hold);
  TestValidator.predicate(
    "right grip holds authored site",
    distance(heldPalms.right, place("right", hold)) <= 0.005,
  );
  TestValidator.predicate(
    "fixed grip separation",
    Math.abs(distance(heldPalms.left, heldPalms.right) - 0.06) <= 0.005,
  );
  const [a, b, c, d] = [69, 70, 71, 72].map(
    (frame: number): IAutoMovieVector3 => palms(frame / 60).right,
  );
  const deviation = (axis: keyof IAutoMovieVector3): number =>
    c![axis] - b![axis] - (b![axis] - a![axis] + (d![axis] - c![axis])) / 2;
  TestValidator.predicate(
    "release displacement at 71/60 s",
    Math.hypot(deviation("x"), deviation("y"), deviation("z")) <=
      AutoMovieMotionHumanAudit.LIMITS.jump,
  );
}
