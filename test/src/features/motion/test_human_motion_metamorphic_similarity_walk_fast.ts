import { TestValidator } from "@nestia/e2e";

import { motionHumanMetamorphic } from "../internal/motionHumanMetamorphic";

/**
 * People of different size who walk at the fast pace move alike at equal Froude number.
 *
 * A metamorphic relation of the action laws (`motionHumanMetamorphic`):
 * it relates two performances to each other, so it checks what many
 * separate cases would without knowing either performance's right answer.
 *
 * Scenario:
 * 1. On the four extreme bodies, the step frequency scaled by the pendulum time `sqrt(l / g)` of the hip height `l`, the duty factor and the stride per hip height each lie within 15 % of the four bodies' mean (Alexander 1984, Int J Robot Res 3:49; provisional tolerance for the spread of preferred speeds).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs real laws in pairs and compares their displayed bones, gaits or events; a gait whose timing does not scale with size fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The relation is dynamic similarity; no expected value is read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases One gait pace on four bodies, each pace its own test.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and performs this relation's films in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the relation, its source and tolerance, and the 1 scenario.
 */
export function test_human_motion_metamorphic_similarity_walk_fast(): void {
  TestValidator.equals(
    "the walk at fast pace is dynamically similar across bodies",
    motionHumanMetamorphic.similarity("walk", "pace=fast"),
    [],
  );
}
