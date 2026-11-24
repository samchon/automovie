import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLegPhrase,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanLegPhrase,
  HumanFoot,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * A ball pivot turns the heel while the ball of the foot stays put.
 *
 * Scenarios:
 * 1. Compare two different sole landmarks on the displayed foot at entry, pivot and return.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the world position and rotation from posed FK at each phase.
 * @evidence contracts/development/testing.md#independent-expectations Rotating about the ball holds its coordinate and carries the heel through a chord of length twice the radius times the sine of half the turn.
 * @evidence contracts/development/testing.md#distinguishing-cases Fixed ball and displaced heel distinguish a rotation about the ankle.
 * @evidence contracts/development/testing.md#execution-ownership One leg primitive acts on a standing body.
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixed and moving landmarks.
 */
export function test_motion_dynamics_primitive_leg_phrase_pivot(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const base: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 1, y: 0, z: 2 }, 90);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(2, [
    { name: "ready", seconds: 0.25 },
    { name: "strokeStart", seconds: 0.5 },
    { name: "stroke", seconds: 1 },
    { name: "strokeEnd", seconds: 1.25 },
    { name: "relax", seconds: 1.5 },
  ]);
  const stance: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: base.limbs.leftLeg!.point,
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanLegPhrase.pivot({
      body,
      side: "left",
      clock,
      stance,
      about: "ball",
      turn: 15,
      pitch: 0,
    });
  const actual = (t: number): IAutoMovieMotionHumanFoot.IPlacement => {
    const foot = poseBones(
      body,
      resolveHumanPosture(body, primitive.write(base, t)),
    ).get("leftFoot")!;
    return { ankle: foot.worldPosition, rotation: foot.worldRotation };
  };
  const at = (
    t: number,
    socket: IAutoMovieMotionHumanLegPhrase.IPivotProps["about"],
  ): IAutoMovieVector3 => HumanFoot.point(body, "left", socket, actual(t));
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.z - b.z);
  const ball: IAutoMovieVector3 = at(0, "ball"),
    heel: IAutoMovieVector3 = at(0, "heel");
  TestValidator.predicate("fixed ball", vclose(at(1, "ball"), ball, 0.005));
  TestValidator.predicate(
    "heel chord",
    nclose(
      distance(at(1, "heel"), heel),
      2 * distance(ball, heel) * Math.sin((15 * Math.PI) / 360),
      0.005,
    ),
  );
  TestValidator.predicate("heel returns", vclose(at(2, "heel"), heel, 0.005));
}
