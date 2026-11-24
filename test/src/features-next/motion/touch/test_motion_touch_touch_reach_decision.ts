import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanReach,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionContactArmFixture as fixture } from "../../../features/internal/motionContactArmFixture";

/**
 * A wrist request on either side of full extension has the appropriate reach-policy outcome.
 *
 * Scenarios:
 * 1. Accept a target below full extension and clamp a farther collinear target at the sum of link lengths.
 * 2. Refuse that same outside point under the explicit refusal policy.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A wrist request on either side of full extension has the appropriate reach-policy outcome.
 * @evidence contracts/development/testing.md#independent-expectations Independent FK yields the two segment lengths and the straight ray determines the clamped point.
 * @evidence contracts/development/testing.md#distinguishing-cases Accept a target below full extension and clamp a farther collinear target at the sum of link lengths. Refuse that same outside point under the explicit refusal policy.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_touch_touch_reach_decision(): void {
  const f: fixture.IInputs = fixture();
  const bones: ReturnType<typeof poseBones> = poseBones(
    f.body,
    resolveHumanPosture(f.body, f.posture),
  );
  const shoulder: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
  const elbow: IAutoMovieVector3 = bones.get("rightLowerArm")!.worldPosition;
  const wrist: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
  const reach: number =
    Vector3.distance(shoulder, elbow) + Vector3.distance(elbow, wrist);
  const point = (distance: number): IAutoMovieVector3 =>
    Vector3.add(shoulder, { x: 0, y: 0, z: distance });
  const within: IAutoMovieVector3 = point(reach / 2);
  const outside: IAutoMovieVector3 = point(reach + f.body.measure.hand);
  const fit: ReturnType<typeof AutoMovieMotionHumanReach.fit> =
    AutoMovieMotionHumanReach.fit(
      f.body,
      f.posture,
      "rightArm",
      within,
      "refuse",
    );
  TestValidator.equals("an attainable target is retained", fit.point, within);
  const limited: ReturnType<typeof AutoMovieMotionHumanReach.fit> =
    AutoMovieMotionHumanReach.fit(
      f.body,
      f.posture,
      "rightArm",
      outside,
      "clamp",
    );
  TestValidator.predicate(
    "the nearest point is at straight reach",
    Vector3.distance(limited.point, point(reach)) <= 1e-9,
  );
  TestValidator.error("a point outside the fixed workspace is refused", () =>
    AutoMovieMotionHumanReach.fit(
      f.body,
      f.posture,
      "rightArm",
      outside,
      "refuse",
    ),
  );
}
