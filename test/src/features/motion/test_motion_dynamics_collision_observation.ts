import { segmentSegmentDistance } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Two crossing capsule axes determine clearance by subtracting their radii.
 *
 * Scenarios:
 * 1. Evaluate the operation at the interior and the limiting case.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Two crossing capsule axes determine clearance by subtracting their radii.
 * @evidence contracts/development/testing.md#independent-expectations The segment closest points both project onto the origin, so their distance is the height offset. The radii sum to a quarter metre.
 * @evidence contracts/development/testing.md#distinguishing-cases The boundary outcome distinguishes physical change from normalization.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_collision_observation(): void {
  const separation = (offset: number): number =>
    segmentSegmentDistance(
      { x: -1, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: offset, z: -1 },
      { x: 0, y: offset, z: 1 },
    ) - 0.25;
  for (const [offset, gap] of [
    [0.5, 0.25],
    [0.25, 0],
    [0.125, -0.125],
  ] as const)
    TestValidator.predicate("surface gap", nclose(separation(offset), gap));
  const clearance = (t: number): number =>
    separation(0.125 + 4 * (t - 0.5) ** 2);
  TestValidator.predicate(
    "interior overlap despite clear endpoints",
    clearance(0) > 0 && clearance(0.5) < 0 && clearance(1) > 0,
  );
}
