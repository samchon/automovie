import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../../features/internal/motionHumanLaw";

/**
 * A hand resting on the ipsilateral hip may touch skin without sinking the hand into the body.
 *
 * Scenarios:
 * 1. Place the right hand in the original hip-rest position.
 * 2. Audit the displayed hand and hips during entry, hold and release against the 10 mm skin limit.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A hand resting on the ipsilateral hip may touch skin without sinking the hand into the body.
 * @evidence contracts/development/testing.md#independent-expectations The physical hand and hip solids are sampled independently from the pose presented to the rest law.
 * @evidence contracts/development/testing.md#distinguishing-cases Place the right hand in the original hip-rest position. Audit the displayed hand and hips during entry, hold and release against the 10 mm skin limit.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_hand_skin_contact(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "digits",
    [{ subject: "a", body }],
    HumanChain.subject("a").rest({ right: "hip", hold: 1 }),
  );
  const failures: string[] = motionHumanLaw.audit(
    film,
    "hand on hip",
    "a",
    body,
  );
  TestValidator.equals(
    "the resting hand has no skin penetration beyond the physical allowance",
    failures,
    [],
  );
}
