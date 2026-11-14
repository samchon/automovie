import { TestValidator } from "@nestia/e2e";

import { motionHumanStrikeScenes } from "../internal/motionHumanStrikeScenes";

/**
 * Two novices punching each other at once each read the other's punch
 * while planning their own, on the average man against the small woman:
 * a jab, a cross and a hook each way plan, or are refused by a
 * `HumanRefusal`, where a punch planned on the other's punch still being
 * planned was read back and threw.
 *
 * Scenarios (`motionHumanStrikeScenes` states the scene):
 * 1. The exchange builds: it plans, or is refused by a `HumanRefusal`; any
 *    other error fails with its name and message.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the scene through the public chain and reads what the build throws; a punch read back while it is planned fails with its message.
 * @evidence contracts/development/testing.md#independent-expectations That a scene plans or is refused, and never throws otherwise, is the grammar's contract for any scene.
 * @evidence contracts/development/testing.md#distinguishing-cases One pair of builds; the large man against the tall woman is its own spec.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one performance in memory, under a minute alone; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the scene, the failure it guards and the scenario.
 */
export function test_human_motion_strike_exchange_novice_m_average(): void {
  TestValidator.equals(
    "two novices punch each other at once",
    motionHumanStrikeScenes.exchange("m-average", "f-small"),
    [],
  );
}
