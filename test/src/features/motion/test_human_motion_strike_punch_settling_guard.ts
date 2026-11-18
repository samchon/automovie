import { TestValidator } from "@nestia/e2e";

import { motionHumanStrikeScenes } from "../internal/motionHumanStrikeScenes";

/**
 * A straight punch launched at a guard still moving as the puncher perceives
 * it is planned on what the puncher sees and corrected as it arrives: the
 * large man's jab at the face of the average man, who steps back out of his
 * guard as it is launched, is planned on the face extrapolated from the
 * step the puncher saw, beyond where it comes to rest, and still lands on
 * the face.
 *
 * Scenarios (`motionHumanStrikeScenes` states the scene and the derivation
 * of the bound):
 * 1. The launch's planned point lies beyond the face at rest, along the line
 *    from the puncher, by more than the partner's step length.
 * 2. The punch's first stop on the partner is on the head.
 * 3. Its elbow's flexion at impact lies within the elbow's range of motion.
 *
 * Until the guard kept its head on the opponent, the guard's own settling
 * moved the face about 10 cm inside the perception, and the punch row's
 * stage launched at it was this spec's scene; the face now hardly travels
 * while the guard settles, so the partner's step is what moves it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the scene through the public chain and reads the punch's own record, the partner's displayed face and step, the hit record and the displayed elbow at impact; a punch planned on observations still to come would plan on the face at rest, and one that is not corrected would stop off the head.
 * @evidence contracts/development/testing.md#independent-expectations The bound follows from the stated perception delay, the step's minimum-jerk speed and a first-order prediction, with the step's length read off the film; the elbow's range is the engine's table.
 * @evidence contracts/development/testing.md#distinguishing-cases A partner moving during the perception, apart from the straight punch's signature at a guard at rest (`test_human_motion_signature_punch_*`).
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one performance in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the scene, what it shows, the former scene and the 3 scenarios.
 */
export function test_human_motion_strike_punch_settling_guard(): void {
  TestValidator.equals(
    "a punch at a guard still moving is planned on what it saw and lands",
    motionHumanStrikeScenes.settling("m-large", "m-average"),
    [],
  );
}
