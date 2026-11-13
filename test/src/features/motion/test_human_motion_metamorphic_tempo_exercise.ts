import { TestValidator } from "@nestia/e2e";

import { motionHumanMetamorphic } from "../internal/motionHumanMetamorphic";

/**
 * A exercise at twice the pace takes half the time.
 *
 * A metamorphic relation of the action laws (`motionHumanMetamorphic`):
 * it relates two performances to each other, so it checks what many
 * separate cases would without knowing either performance's right answer.
 *
 * Scenario:
 * 1. A manner of pace 2 halves every span the performer chooses: the action lasts half as long, every event at half its time, within 1 % (the manner's own definition; none of these spans is set by physics).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs real laws in pairs and compares their displayed bones, gaits or events; a span the pace leaves unscaled fails with its numbers.
 * @evidence contracts/development/testing.md#independent-expectations The relation is the manner's definition; no expected value is read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases One law at two paces, each law its own test.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and performs this relation's films in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the relation, its source and tolerance, and the 1 scenario.
 */
export function test_human_motion_metamorphic_tempo_exercise(): void {
  TestValidator.equals(
    "the exercise at pace 2 takes half the time",
    motionHumanMetamorphic.tempo("exercise", { kind: "squat" }),
    [],
  );
}
