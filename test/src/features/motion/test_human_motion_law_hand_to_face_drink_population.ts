import { TestValidator } from "@nestia/e2e";

import { motionHumanLawHandToFace } from "../internal/motionHumanLawHandToFace";

/**
 * The hand-to-face task `drink` tips the cup at the mouth only as much as
 * the arm needs, on four bodies of the population: apart from the right-hand
 * film's own expectations (`test_human_motion_law_hand_to_face_drink`), so each
 * runs within the time a test may take.
 *
 * Each body performs the task from quiet standing and is read at the task's
 * event by `motionHumanLawHandToFace` (its `population` part).
 *
 * Scenarios:
 * 1. On the average man, the woman one standard deviation down, the small
 *    woman and the large man, the cup's axis at the mouth leans with its top
 *    toward the face and no more than the lean the law asked plus one
 *    `AutoMovieMotionHumanTouchDrink.LEAN_STEP`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the real law on four bodies and reads the displayed hand's rotation; a cup tipped away from the face or past its asked lean fails with its angle.
 * @evidence contracts/development/testing.md#independent-expectations The lean's direction is the face's; its bound is the drinking arm's asked lean plus one search step, stated in the checker's document with its source.
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies of different size on one vessel task; the film spec reads the rest.
 * @evidence contracts/development/testing.md#execution-ownership In memory; four films read at one instant each; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the task, why it stands apart and the scenario with its bound.
 */
export function test_human_motion_law_hand_to_face_drink_population(): void {
  TestValidator.equals(
    "the drink cup leans as the arm needs on every body",
    motionHumanLawHandToFace("drink", "population"),
    [],
  );
}
