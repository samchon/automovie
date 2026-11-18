import { samplePoseVelocity } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * A one-sided pose derivative distinguishes approach and departure at a kink.
 *
 * Scenarios:
 * 1. Compare the interior observation and boundary state with the prescribed continuous law.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A one-sided pose derivative distinguishes approach and departure at a kink.
 * @evidence contracts/development/testing.md#independent-expectations The derivative of the quadratic is twice time; the ramp adds one only on the outgoing side.
 * @evidence contracts/development/testing.md#distinguishing-cases Boundary and interior inputs distinguish the two behaviors.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_pose_velocity(): void {
  const knee = (t: number, rounded: boolean): IAutoMoviePose => ({
    skeleton: "knee",
    root: null,
    joints: [
      {
        bone: "leftLowerLeg",
        flexion: rounded
          ? Math.round((10 + 33.7 * t) * 100) / 100
          : 10 + 33.7 * t,
        abduction: 0,
        twist: 0,
      },
    ],
  });
  const shown = (t: number): IAutoMoviePose => knee(t, true);
  const exact = (t: number): IAutoMoviePose => knee(t, false);
  const exactRate = samplePoseVelocity(
    shown,
    0.4,
    0.001,
    "after",
    undefined,
    exact,
  );
  TestValidator.predicate(
    "continuation does not replace the displayed pose",
    exactRate.pose.joints[0]!.flexion === shown(0.4).joints[0]!.flexion &&
      nclose(exactRate.velocity.joints.get("leftLowerLeg")![0], 33.7, 1e-9),
  );
  TestValidator.predicate(
    "rounded geometry changes the apparent tangent",
    Math.abs(
      samplePoseVelocity(shown, 0.4, 0.001, "after").velocity.joints.get(
        "leftLowerLeg",
      )![0] - 33.7,
    ) > 1,
  );
  TestValidator.predicate(
    "continuation tolerance in pose units",
    nclose(
      samplePoseVelocity.tolerance(0.001, 0.4),
      (0.01 * 0.001 * 3125) / (8 * 256 * 0.4),
      1e-15,
    ),
  );
  TestValidator.predicate(
    "positive observation span",
    throwsError(() => samplePoseVelocity(exact, 0, 0, "before")) &&
      throwsError(() => samplePoseVelocity.tolerance(0.001, 0)),
  );
  const sample = (t: number): IAutoMoviePose => ({
    skeleton: "root",
    joints: [],
    root: {
      translation: { x: Math.max(t, 0) + t * t, y: 0, z: t },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  });
  for (const [t, side, dx] of [
    [0, "before", 0],
    [0, "after", 1],
    [0.5, "after", 2],
  ] as const) {
    const v = samplePoseVelocity(sample, t, 1e-3, side).velocity.linear;
    TestValidator.predicate(
      "one-sided world velocity",
      nclose(v.x, dx, 1e-6) && nclose(v.z, 1, 1e-6),
    );
  }
}
