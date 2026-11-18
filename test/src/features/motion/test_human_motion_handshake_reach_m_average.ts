import { TestValidator } from "@nestia/e2e";

import { motionHandshakeReach } from "../internal/motionHandshakeReach";

/**
 * Equal-height shoulders give a level elbow pair. At the documented
 * 0.729 m regression gap (#3519), the public handshake must plan with
 * the displayed horizontal shoulder spacing preserved within 1 mm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the original scene and the measured point pair.
 * @evidence contracts/development/testing.md#behavioral-verification Reads both displayed upper-arm origins from the public handshake.
 * @evidence contracts/development/testing.md#independent-expectations The known input is the shoulder separation staged from a standing film.
 * @evidence contracts/development/testing.md#distinguishing-cases Equal heights exercise the level offer. The unequal-height pair separately checks the far refusal and its interval.
 * @evidence contracts/development/testing.md#execution-ownership One standing setup and one handshake.
 */
export function test_human_motion_handshake_reach_m_average(): void {
  TestValidator.equals(
    "level shoulders meet across the original near gap",
    motionHandshakeReach("m-average", "m-average", false),
    [],
  );
}
