import { TestValidator } from "@nestia/e2e";

import { motionHumanMetamorphic } from "../internal/motionHumanMetamorphic";

/**
 * A crouch (default) does not depend on where it is performed or which way it faces.
 *
 * A metamorphic relation of the action laws (`motionHumanMetamorphic`):
 * it relates two performances to each other, so it checks what many
 * separate cases would without knowing either performance's right answer.
 *
 * Scenario:
 * 1. The scene turned 90 degrees about +Y and moved 3 m across and 2 m back is the same performance: its bones are the turned and moved bones within 1 mm at every quarter second, and it lasts as long (the laws of motion hold the same in every place and heading).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs real laws in pairs and compares their displayed bones, gaits or events; a law that depends on where it stands fails with its distance and instant.
 * @evidence contracts/development/testing.md#independent-expectations The relation is the symmetry of space; no expected value is read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases One law of the five placed twice, each its own test.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and performs this relation's films in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the relation, its source and tolerance, and the 1 scenario.
 */
export function test_human_motion_metamorphic_placement_crouch(): void {
  TestValidator.equals(
    "the crouch placed elsewhere is the same performance",
    motionHumanMetamorphic.placement("crouch", "default"),
    [],
  );
}
