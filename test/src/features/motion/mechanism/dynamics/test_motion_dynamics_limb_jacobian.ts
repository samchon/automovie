import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  HumanJacobian,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { vclose } from "../../../internal/vclose";

/**
 * An elbow Jacobian moves its hand tangentially and leaves the elbow centre
 * fixed.
 *
 * Scenarios:
 *
 * 1. Read the elbow’s angular and translational derivatives and compare with a
 *    small actual positive articulation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification An elbow Jacobian moves its hand tangentially and leaves the elbow centre fixed.
 * @evidence contracts/development/testing.md#independent-expectations Rigid-body differentiation gives hand velocity equal to angular velocity cross the elbow-to-hand radius, with radians per clinical degree.
 * @evidence contracts/development/testing.md#distinguishing-cases The pivot itself has zero linear derivative while the distal point moves.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_limb_jacobian(): void {
  const body = motionHumanBody("m-average"),
    standing = AutoMovieMotionHumanStance.stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
  const posture = (flexion: number): IAutoMovieMotionHumanPosture => ({
    ...standing,
    limbs: {},
    joints: { ...standing.joints, leftLowerArm: [flexion, 0, 0] },
  });
  const bones = (f: number) =>
    poseBones(body, resolveHumanPosture(body, posture(f)));
  const actual = bones(30),
    elbow = actual.get("leftLowerArm")!.worldPosition,
    hand = actual.get("leftHand")!.worldPosition;
  const derivative = HumanJacobian(body, posture(30), actual, [
    { kind: "angle", bone: "leftLowerArm", axis: 0 },
  ])[0]!;
  const turn = HumanJacobian.twist(derivative, "leftLowerArm", elbow);
  const radius: IAutoMovieVector3 = {
      x: hand.x - elbow.x,
      y: hand.y - elbow.y,
      z: hand.z - elbow.z,
    },
    w = turn.angular;
  const expected: IAutoMovieVector3 = {
    x: w.y * radius.z - w.z * radius.y,
    y: w.z * radius.x - w.x * radius.z,
    z: w.x * radius.y - w.y * radius.x,
  };
  const linear = HumanJacobian.velocity(derivative, "leftHand", hand);
  TestValidator.predicate(
    "hinge centre fixed",
    vclose(turn.linear, { x: 0, y: 0, z: 0 }, 1e-6),
  );
  TestValidator.predicate(
    "tangent about elbow",
    vclose(linear, expected, 1e-6),
  );
  const h = 0.001,
    left = bones(30 - h).get("leftHand")!.worldPosition,
    right = bones(30 + h).get("leftHand")!.worldPosition;
  TestValidator.predicate(
    "actual hand derivative per degree",
    vclose(
      linear,
      {
        x: (right.x - left.x) / (2 * h),
        y: (right.y - left.y) / (2 * h),
        z: (right.z - left.z) / (2 * h),
      },
      1e-6,
    ),
  );
}
