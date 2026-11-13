import { TestValidator } from "@nestia/e2e";

import { motionCompositionProbe } from "../internal/motionCompositionProbe";

/**
 * A composition probe of the coverage ledger (`motionCompositionProbe`)
 * plans and keeps every physical bound. A phone held while walking: a production layer holding the right arm ahead of the chest over a 3 m walk.
 *
 * Performed by the average man alone (the partner is staged only for the
 * probes that involve her). A probe
 * that plans with a clean verdict report is expressible by composition; a
 * refusal or a broken bound names what the grammar or a law still lacks.
 *
 * Scenario:
 * 1. The probe plans, and the shipped verdict report of its performance is
 *    clean.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the composition through the public chain and performance and reads the shipped verdict report; a refusal or any broken bound fails with the probe's name and the report.
 * @evidence contracts/development/testing.md#independent-expectations The probe is an act people perform, so it must plan and break no physical bound; no value is read from the laws.
 * @evidence contracts/development/testing.md#distinguishing-cases One of the nine combinations the coverage research found unverified, each its own test.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and performs one film with its report in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the probe's act, who performs it, what a pass means and the 1 scenario.
 */
export function test_human_motion_composition_probe_texting_walk(): void {
  TestValidator.equals(
    "the textingWalk probe plans and reports clean",
    motionCompositionProbe.run("textingWalk"),
    [],
  );
}
