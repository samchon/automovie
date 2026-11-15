import { TestValidator } from "@nestia/e2e";

import { motionHumanStrikeScenes } from "../internal/motionHumanStrikeScenes";

/**
 * A straight punch launched at a guard still settling as the puncher
 * perceives it is planned on what the puncher sees and corrected as it
 * arrives: the large man's jab at the average man's face, launched at 0.8 s
 * while the partner's guard settles until 0.6 s, perceived a reaction time
 * earlier and so extrapolated about 10 cm beyond where the face comes to
 * rest, lands bent.
 *
 * Scenarios (`motionHumanStrikeScenes` states the scene):
 * 1. The punch records `jammed`.
 * 2. Its elbow's flexion at impact lies within the elbow's range of motion.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the scene through the public chain and reads the punch's own record and the displayed elbow at its impact; a punch planned on observations still to come would land extended and record otherwise.
 * @evidence contracts/development/testing.md#independent-expectations The perceived target moves only because the guard settles inside the reaction time the puncher reads it through; the elbow's range is the engine's table.
 * @evidence contracts/development/testing.md#distinguishing-cases The guard settling during the perception, apart from the straight punch's signature at a guard at rest (`test_human_motion_signature_punch_*`).
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one performance in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the scene, what it shows and the 2 scenarios.
 */
export function test_human_motion_strike_punch_settling_guard(): void {
  TestValidator.equals(
    "a punch at a settling guard lands bent",
    motionHumanStrikeScenes.settling("m-large", "m-average"),
    [],
  );
}
