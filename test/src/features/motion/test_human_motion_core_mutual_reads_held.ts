import { TestValidator } from "@nestia/e2e";

import { motionHumanMutualReads } from "../internal/motionHumanMutualReads";

/**
 * Two people each with a hand pressed and held 2 s on the other's shoulder
 * read each other at once: the scene plans, and its film reads from its end
 * and from its start on the default stack, each hand riding the other body
 * a frame behind instead of reading the posture the other is still solving.
 *
 * Scenarios (`motionHumanMutualReads` states the scene), the average man
 * against the small woman:
 * 1. The scene plans, or is refused by a `HumanRefusal`, and, planned, every
 *    24th of a second of both people's film reads from the end back, then
 *    from the start on.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the scene through the public chain and reads every frame of both people in two orders; a nested read that overruns the stack, or any error but a refusal, fails with its message and where it was thrown.
 * @evidence contracts/development/testing.md#independent-expectations That a scene plans or is refused, and that a planned film reads in any order, is the grammar's contract for any scene.
 * @evidence contracts/development/testing.md#distinguishing-cases Two hands held on each other at once, the mutual read a choke's scenes make, on a scene that plans; the choke's are their own spec.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one performance in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the failure it guards and the scenario.
 */
export function test_human_motion_core_mutual_reads_held(): void {
  TestValidator.equals(
    "two hands held on each other read each other",
    motionHumanMutualReads.read("held", "m-average", "f-small"),
    [],
  );
}
