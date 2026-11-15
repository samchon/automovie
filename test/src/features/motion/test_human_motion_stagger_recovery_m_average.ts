import { TestValidator } from "@nestia/e2e";

import { motionStaggerRecovery } from "../internal/motionStaggerRecovery";

/**
 * A pushed person recovers by stepping where the capture-point rule puts
 * each step, within a person's measured step times and lengths, and a push
 * no four steps catch is refused as a fall with the body's limit (#3523).
 *
 * The stagger stepped once to the middle of its ankles and left the centre of
 * mass outside its base, dragged its stepping toe along the floor and froze
 * its arms; it now catches the body by Hof's extrapolated centre of mass,
 * lifts its feet as a walk does and abducts its arms as people do.
 *
 * Scenarios, on the average man, read by `motionStaggerRecovery` (the small
 * woman has her own spec):
 * 1. Pushed backward at 0.5 m/s: plans with a clean verdict report.
 * 2. Pushed to the right at 0.5 m/s: plans with a clean verdict report.
 * 3. Pushed backward at 1.5 m/s: refused on `parameter`/`speed` with the
 *    fastest push this body catches that way, between 0.5 and 1.5 m/s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each stagger through the public chain and reads the shipped verdict report and the refusal; a broken bound or a refusal on another axis fails with what was read.
 * @evidence contracts/development/testing.md#independent-expectations The speeds lie inside and outside the capture region the measured lean-and-release bounds give every body; the verdicts are the shipped report's own.
 * @evidence contracts/development/testing.md#distinguishing-cases A backward and a sideways recovery and one fall.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds two short films and one refused plan, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the defects it replaces and the 3 scenarios.
 */
export function test_human_motion_stagger_recovery_m_average(): void {
  TestValidator.equals(
    "a push is caught by recovery steps or refused as a fall",
    motionStaggerRecovery("m-average"),
    [],
  );
}
