import { TestValidator } from "@nestia/e2e";

import { motionHumanMutualReads } from "../internal/motionHumanMutualReads";

/**
 * A choke and the struggle against it read each other at once: the
 * production's record (both palms squeezed on the neck against both hands
 * at the attacker's forearms, the two 0.5 m apart from the film's start) and
 * its longer version (a restraint and a hair pull after the choke; standing
 * and the grabbed reaction after the struggle) plan, or are refused by a
 * `HumanRefusal`, and a planned film reads from its end and from its start
 * on the default stack, where the two poses nested inside each other back
 * to the film's start overran it.
 *
 * Scenarios (`motionHumanMutualReads` states each scene), on the large man
 * against the average man and on the average man against the small woman:
 * 1. The choke against the struggle builds and, planned, reads both ways.
 * 2. The longer version builds and, planned, reads both ways.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the production's scenes through the public chain and reads every frame of both people in two orders; a nested read that overruns the stack, or any error but a refusal, fails with its message and where it was thrown.
 * @evidence contracts/development/testing.md#independent-expectations That a scene plans or is refused, and that a planned film reads in any order, is the grammar's contract for any scene.
 * @evidence contracts/development/testing.md#distinguishing-cases The production's record and its longer version, on two pairs of builds; two hands held on each other's shoulders are their own spec.
 * @evidence contracts/development/testing.md#execution-ownership Prepares three polygon men and builds four short performances in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the scenes, the failure they guard and the 2 scenarios.
 */
export function test_human_motion_core_mutual_reads_choke(): void {
  const complaints: string[] = [];
  for (const [attacker, victim] of [
    ["m-large", "m-average"],
    ["m-average", "f-small"],
  ] as const)
    for (const scene of ["choke", "chokeRound"] as const)
      complaints.push(...motionHumanMutualReads.read(scene, attacker, victim));
  TestValidator.equals(
    "a choke and the struggle against it read each other",
    complaints,
    [],
  );
}
