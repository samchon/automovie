import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, instance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `instance` performs a member as another member's placed posture, shifted in
 * phase, and refuses a member whose posture cannot be read.
 *
 * Scenarios:
 *
 * 1. An instance of `b`, which is not performed, is refused on `of`.
 */
export async function test_unit_motions_ensemble_instance(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const refused = (run: () => unknown): string | undefined => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  TestValidator.equals(
    "an unread member",
    refused(() =>
      instance.plan(motionActionContext(body, { of: "b", duration: 1 })),
    ),
    "of",
  );
}