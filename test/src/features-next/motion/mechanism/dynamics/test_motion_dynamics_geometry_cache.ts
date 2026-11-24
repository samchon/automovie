import { HumanFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../../features/internal/vclose";

/**
 * A changing frame transforms the same local landmark according to the current heading.
 *
 * Scenarios:
 * 1. Evaluate the public operation on the same geometry across different orientations.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A changing frame transforms the same local landmark according to the current heading.
 * @evidence contracts/development/testing.md#independent-expectations A unit forward landmark displaces Z in a zero heading and X in a quarter turn.
 * @evidence contracts/development/testing.md#distinguishing-cases Repeated and changed frames have independently known world-space results.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_geometry_cache(): void {
  const origin = { x: 2, y: 3, z: 4 };
  const quarter = HumanFrame.prepare({ origin, yaw: 90 });
  const neutral = HumanFrame.prepare({ origin, yaw: 0 });
  TestValidator.predicate(
    "an independently prepared frame uses its own heading",
    vclose(neutral.point({ x: 0, y: 0, z: 1 }), { x: 2, y: 3, z: 5 }),
  );
  const first = quarter.point({ x: 0, y: 0, z: 1 });
  const other = quarter.point({ x: 0, y: 0, z: 2 }, { x: 0, y: 0, z: 1 });
  const repeated = quarter.point({ x: 0, y: 0, z: 1 });
  TestValidator.predicate(
    "quarter turn displaces X",
    vclose(first, { x: 3, y: 3, z: 4 }),
  );
  TestValidator.predicate(
    "a current origin and changed local landmark retain their own values",
    vclose(other, { x: 2, y: 0, z: 1 }) && vclose(repeated, first),
  );
}
