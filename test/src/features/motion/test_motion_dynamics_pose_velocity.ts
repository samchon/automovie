import { samplePoseVelocity } from "@automovie/engine";
import type { IAutoMoviePose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

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
