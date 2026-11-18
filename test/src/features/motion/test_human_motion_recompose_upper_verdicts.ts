import { TestValidator } from "@nestia/e2e";

import { motionRowVerdicts } from "../internal/motionRowVerdicts";

/**
 * The upper-body rows preserve the verdicts of their native law after a
 * quiet stance. Air quotes use the gesture's bilateral pose and finger
 * shapes; blowing the nose uses a palm fit driven by a region on the
 * displayed head. Each keeps the same frame bounds over its whole film.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the two native action paths through the public chain and reads the shipped verdict report on the displayed films.
 * @evidence contracts/development/testing.md#independent-expectations The verdict limits remain the ones specified by the shipped report.
 * @evidence contracts/development/testing.md#distinguishing-cases A bilateral finger pose on the tall woman and target-driven fitting with a bowed head on the large man.
 * @evidence contracts/development/testing.md#execution-ownership Two independent short performances on prepared bodies, in memory.
 * @evidence contracts/development/common.md#meaningful-documentation Names the branches, body proportions and unchanged frame bounds.
 */
export function test_human_motion_recompose_upper_verdicts(): void {
  for (const [row, body] of [
    ["airQuotes", "f-tall"],
    ["blowNose", "m-large"],
  ] as const)
    TestValidator.equals(
      `${row} on ${body} holds the verdict bounds`,
      motionRowVerdicts(row, body),
      "clean",
    );
}
