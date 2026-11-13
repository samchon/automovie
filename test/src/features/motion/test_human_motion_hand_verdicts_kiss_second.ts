import { TestValidator } from "@nestia/e2e";

import { motionKissVerdicts } from "../internal/motionKissVerdicts";

/**
 * The lexicon's `blownKiss` row, the fingertips brought to the lips, holds
 * every physical bound of human motion over the second half of its film when
 * simply performed: stood for 0.3 s, then the row.
 *
 * `HumanVerdicts` reads the bounds that hold whatever a motion means: no
 * part of the body more than 10 mm inside another, every joint centre on a
 * continuous path, no bone spinning more than 5 turns a second, every joint
 * within its range. One report of the whole film took up to a minute, so
 * each half is its own spec (`motionKissVerdicts`), the halves overlapping
 * by two frames. With the hand upright before the face the forearm's turn
 * stood at the end of its range and the arm's fit changed its solution
 * between instants; the hand now leans half way to level.
 *
 * Scenarios:
 * 1. A clean report on the small woman at 24 samples a second, the
 *    product's rate, over the second half of the film: the bounds read only at
 *    grid instants are read at every frame of film, and a step between them
 *    is quartered as well.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the lexicon, performs the row through the public chain and reads the shipped verdict report on the displayed film; a part inside another, a joint that steps or a bone that spins fails with the finding's place.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the verdict report's own, which hold for any human motion; none is read from the row.
 * @evidence contracts/development/testing.md#distinguishing-cases One row on one body, one half of its film; `test_human_motion_hand_verdicts_kiss` and `_kiss_second` read the two halves.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and audits half of one short film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the bounds, why the film is read in halves, what the row was and the scenario.
 */
export function test_human_motion_hand_verdicts_kiss_second(): void {
  TestValidator.equals(
    "a blown kiss holds the physical bounds over the second half",
    motionKissVerdicts(2),
    "clean",
  );
}
