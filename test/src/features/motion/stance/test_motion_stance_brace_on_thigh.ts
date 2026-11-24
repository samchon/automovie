import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanLean,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionContactArmFixture as fixture } from "../../internal/motionContactArmFixture";

/**
 * The right palm braces on the posed right thigh and releases to its entering
 * wrist position.
 *
 * Scenarios:
 *
 * 1. Prepare a forward-leaning body and observe the outer hand against the actual
 *    thigh capsule in the held phase.
 * 2. Compare the released wrist to its independent starting frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The right palm braces on the posed right thigh and releases to its entering wrist position.
 * @evidence contracts/development/testing.md#independent-expectations A brace needs contact with the thigh skin, measured by posed colliders, and may indent the skin by at most 10 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Prepare a forward-leaning body and observe the outer hand against the actual thigh capsule in the held phase. Compare the released wrist to its independent starting frame.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_stance_brace_on_thigh(): void {
  const f: fixture.IInputs = fixture();
  const rest: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanLean.pivot(
    f.body,
    f.posture,
    { pitch: 30, roll: 0 },
  );
  const entry: IAutoMoviePose = resolveHumanPosture(f.body, rest);
  const original: ReturnType<typeof poseBones> = poseBones(f.body, entry);
  const arm: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanStance.braceOnThigh(
      f.body,
      "right",
      AutoMovieMotionHumanArm.angles(entry, "right"),
      2,
      (s: number): number => (s <= 1 ? s : 2 - s),
      { start: 0, ready: 1, relax: 1, end: 2 },
    );
  const before = (): IAutoMovieMotionHumanPosture => rest;
  arm.prepare!(before);
  const held: ReturnType<typeof poseBones> = poseBones(
    f.body,
    resolveHumanPosture(f.body, arm.write(rest, 1, before)),
  );
  const gap: number = fixture.separation(
    f.body,
    held,
    /^right(Hand|Thumb|Index|Middle|Ring|Little)/,
    f.body,
    held,
    /^rightUpperLeg$/,
  );
  TestValidator.predicate(
    `the displayed hand and thigh have signed separation ${gap} m`,
    Math.abs(gap) <= 0.01,
  );
  const released: ReturnType<typeof poseBones> = poseBones(
    f.body,
    resolveHumanPosture(f.body, arm.write(rest, 2, before)),
  );
  TestValidator.predicate(
    "release restores wrist",
    Vector3.distance(
      released.get("rightHand")!.worldPosition,
      original.get("rightHand")!.worldPosition,
    ) <= 0.001,
  );
}
