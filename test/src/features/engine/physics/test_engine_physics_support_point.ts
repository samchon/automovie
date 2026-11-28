import { AutoMovieEnginePhysics } from "@automovie/engine";
import type { IAutoMovieRigidTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `physicalSupportPoint` places an authored local support point by a bone pose.
 *
 * Pose: position (1, 2, 3), a quarter turn about z.
 *
 * Scenarios:
 *
 * 1. The local point (1, 0, 0) turns to (0, 1, 0) and lands at (1, 3, 3).
 * 2. Without a local point the result is a copy of the position.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes transforming an authored bone-local point from returning an independent copy of the bone origin.
 * @evidence contracts/development/testing.md#behavioral-verification Calls physicalSupportPoint with and without a point on the same translated quarter-turn pose.
 * @evidence contracts/development/testing.md#independent-expectations Turning (1, 0, 0) about z gives (0, 1, 0), so adding (1, 2, 3) lands at (1, 3, 3). The absent point returns equal coordinates with distinct identity.
 */
export function test_engine_physics_support_point(): void {
  const h: number = Math.SQRT1_2;
  const pose: IAutoMovieRigidTransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: 0, z: h, w: h },
  };
  const placed = AutoMovieEnginePhysics.physicalSupportPoint(pose, { x: 1, y: 0, z: 0 });
  TestValidator.predicate(
    "placed",
    nclose(placed.x, 1, 1e-12) &&
      nclose(placed.y, 3, 1e-12) &&
      nclose(placed.z, 3, 1e-12),
  );
  const bare = AutoMovieEnginePhysics.physicalSupportPoint(pose);
  TestValidator.equals("origin", bare, { x: 1, y: 2, z: 3 });
  TestValidator.predicate("copy", bare !== pose.position);
}
