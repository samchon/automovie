import { TestValidator } from "@nestia/e2e";

import { motionHumanMetamorphic } from "../internal/motionHumanMetamorphic";

/**
 * Every striking law that acts on one side mirrors: a row on the left is the mirror image of its right row.
 *
 * A metamorphic relation of the action laws (`motionHumanMetamorphic`):
 * it relates two performances to each other, so it checks what many
 * separate cases would without knowing either performance's right answer.
 *
 * Scenario:
 * 1. Each row of a striking law that sets the performer's own side to `left` is performed with the average man and compared with the mirror image of its `right` row: the bones agree within the 10 mm skin tolerance (a human body is bilaterally symmetric).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs real laws in pairs and compares their displayed bones, gaits or events; a lopsided side or a refused row fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The relation is the body's bilateral symmetry; no expected value is read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases Every side parameter of every striking law.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and performs this relation's films in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the relation, its source and tolerance, and the 1 scenario.
 */
export function test_human_motion_metamorphic_mirror_striking(): void {
  TestValidator.equals(
    "every striking side mirrors",
    motionHumanMetamorphic.mirror("striking"),
    [],
  );
}
