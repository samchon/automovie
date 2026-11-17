import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPrimitive, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanArm, poseBones, resolveHumanPosture, stand } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A planned arm's sweep reads its motion relative to the body it is swept
 * past, so an arm held still by a walking body is never swept into its own
 * trunk.
 *
 * Scenario: the average man walks forward at 1 m/s for 2 s, his quiet
 * stance carried along, while his right hand is planned to stay where it
 * hangs, its wrist's place carried with him; the plan is made without a
 * refusal, and every written frame at 30 a second keeps the wrist within
 * 11 mm of that place over the hold, the planner's 10 mm site disc and a
 * millimetre.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans and writes a real carried arm over a moving body and reads the wrist on the resolved pose; a sweep against the body frozen at a waypoint refuses the still arm as passing through the trunk's old place.
 * @evidence contracts/development/testing.md#independent-expectations The walk, the hanging place and the bound are written here; the disc is the planner's stated 10 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases A body in motion under an arm at rest relative to it, the case where the world sweep and the relative sweep differ.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the scenario and its bounds.
 */
export function test_human_motion_core_sweep_walking(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const speed: number = 1;
  const walking = (seconds: number): IAutoMovieMotionHumanPosture =>
    stand.posture(body, { x: 0, y: 0, z: speed * seconds }, 0);
  const quiet: IAutoMovieMotionHumanPosture = walking(0);
  const bones = poseBones(body, resolveHumanPosture(body, quiet));
  const wrist: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
  const elbow: IAutoMovieVector3 = bones.get("rightLowerArm")!.worldPosition;
  const shift = (p: IAutoMovieVector3, seconds: number): IAutoMovieVector3 => ({
    x: p.x,
    y: p.y,
    z: p.z + speed * seconds,
  });
  const span = { start: 0, ready: 0.4, relax: 1.6, end: 2 };
  const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried({
    body,
    side: "right",
    from: span.start,
    to: span.end,
    rest: AutoMovieMotionHumanArm.angles(
      resolveHumanPosture(body, quiet),
      "right",
    ),
    goal: (_: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture.IGoal => ({
      point: shift(wrist, seconds),
      bend: shift({ x: elbow.x - 0.1, y: elbow.y, z: elbow.z - 0.1 }, seconds),
      rotation: bones.get("rightHand")!.worldRotation,
    }),
    weight: (): number => 0,
    span,
  });
  arm.prepare!(walking);
  let off: number = 0;
  for (let i: number = 0; i <= Math.round(span.end * 30); i++) {
    const seconds: number = i / 30;
    if (seconds < span.ready || seconds > span.relax) continue;
    const posture: IAutoMovieMotionHumanPosture = arm.write(
      walking(seconds),
      seconds,
      walking,
    );
    const at: IAutoMovieVector3 = poseBones(
      body,
      resolveHumanPosture(body, posture),
    ).get("rightHand")!.worldPosition;
    const place: IAutoMovieVector3 = shift(wrist, seconds);
    off = Math.max(
      off,
      Math.hypot(at.x - place.x, at.y - place.y, at.z - place.z),
    );
  }
  TestValidator.predicate(
    `the walking body's still arm keeps its wrist within ${(off * 1000).toFixed(1)} mm of its place`,
    off <= 0.011,
  );
}
