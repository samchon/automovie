import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * Rows of an action that rides a carrier ride one, and a mutual record
 * joins two people: the scenes of the lexicon a row performed alone cannot
 * show plan on the average man and the small woman, each with the other.
 *
 * Scenarios, for each pairing of the two bodies:
 * 1. A person carried by another who walks 2 m plans.
 * 2. A salute performed over a walk of 3 m plans.
 * 3. Each mutual record of the social family (the bump, the toast) joins
 *    the two and plans.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each scene through the public input on real bodies; a refusal fails with the scene, the body and the refusal's own message.
 * @evidence contracts/development/testing.md#independent-expectations That each scene is performable is what the lexicon claims; nothing is compared with a value read from a law.
 * @evidence contracts/development/testing.md#distinguishing-cases A carried row on a walking carrier, an overlay row on a walk and two mutual records, for both pairings of opposite builds.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds eight short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned and the 3 scenarios.
 */
export function test_human_motion_lexicon_rows_scenes(): void {
  TestValidator.equals("every scene is performable", LexiconRowNet.scenes(), []);
}
