import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";

/**
 * Plans registered set and handstand from a quiet stance.
 *
 * Scenarios:
 * 1. The public chain places the registered row under its own name.
 * 2. The planned timeline has positive duration on the staged body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names this branch and the two placement checks.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the actual registered law on the public chain and observes the placed segment. A refusal, wrong name or zero active duration is reported with the performer.
 * @evidence contracts/development/testing.md#independent-expectations The authored input names a performable row and requests a nonempty action with that name.
 * @evidence contracts/development/testing.md#distinguishing-cases Uses the original row and pose setup. Separate specs cover concurrent contact and other physical mechanisms.
 * @evidence contracts/development/testing.md#execution-ownership The test prepares its body and plans in memory, without starting a host.
 */
export function test_human_motion_lexicon_rows_sport_start_aliases(): void {
  TestValidator.equals(
    "registered plans cover registered set and handstand from a quiet stance",
    LexiconRowNet.rows("sport", LexiconRowNet.SPORT.start),
    [],
  );
}
