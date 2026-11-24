import { inertializeOffset, samplePoseVelocity } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";
import { throwsError } from "../../../../features/internal/throwsError";

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
      1e-18,
    ),
  );
  TestValidator.predicate(
    "positive observation span",
    throwsError(() => samplePoseVelocity(exact, 0, 0, "before")) &&
      throwsError(() => samplePoseVelocity.tolerance(0, 0.4)) &&
      throwsError(() => samplePoseVelocity.tolerance(0.001, 0)),
  );
  const h = 0.001;
  const duration = 0.4;
  const tolerance = samplePoseVelocity.tolerance(h, duration);
  const perturbed = (t: number): IAutoMoviePose => ({
    skeleton: "knee",
    root: null,
    joints: [
      {
        bone: "leftLowerLeg",
        flexion: 10 + (Math.round(t / h) === 1 ? tolerance : -tolerance),
        abduction: 0,
        twist: 0,
      },
    ],
  });
  const worst = samplePoseVelocity(
    perturbed,
    0,
    h,
    "after",
  ).velocity.joints.get("leftLowerLeg")![0];
  TestValidator.predicate(
    "one-sided worst rounding rate and two opposite readers at peak offset",
    nclose(worst, (4 * tolerance) / h, 1e-9) &&
      nclose(
        inertializeOffset(0, 2 * worst, duration, duration / 5, true).value,
        0.01,
        1e-12,
      ),
  );
  const sample = (t: number): IAutoMoviePose => ({
    skeleton: "root",
    joints: [],
    root: {
      translation: { x: Math.max(t, 0) + t * t, y: 0, z: t },
      rotation: {
        x: 0,
        y: Math.sin(Math.max(t, 0)),
        z: 0,
        w: Math.cos(Math.max(t, 0)),
      },
      scale: { x: 1, y: 1, z: 1 },
    },
  });
  for (const [t, side, dx] of [
    [0, "before", 0],
    [0, "after", 1],
    [0.5, "after", 2],
  ] as const) {
    const measured = samplePoseVelocity(sample, t, 1e-3, side).velocity;
    const v = measured.linear;
    TestValidator.predicate(
      "one-sided world velocity",
      nclose(v.x, dx, 1e-6) &&
        nclose(v.z, 1, 1e-6) &&
        nclose(measured.angular.y, side === "before" ? 0 : 2, 1e-6),
    );
  }
  const centered = samplePoseVelocity(sample, 0, h, "both").velocity;
  TestValidator.predicate(
    "centered reads average angular and linear slopes at the cut",
    nclose(centered.angular.y, 1, 1e-6) && nclose(centered.linear.x, 0.5, 1e-6),
  );
}
