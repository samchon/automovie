import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, shift } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `shift` slides a seated body along its seat within the planted legs' side
 * reach.
 *
 * Scenarios:
 *
 * 1. Its record names it `shift`.
 * 2. A 5 m shift is refused on `by`.
 */
export async function test_unit_motions_everyday_shift(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const refused = (run: () => unknown): string | undefined => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  TestValidator.predicate("the record", shift.name === "shift");
  TestValidator.equals(
    "past the reach",
    refused(() => shift.plan(motionActionContext(body, { by: 5 }))),
    "by",
  );
}
