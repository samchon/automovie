import type { IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody } from "@automovie/interface";
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
 * 1. An instance of `b`, a member of another body, is refused on `of`.
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
  const other: IAutoMovieMotionHumanBody = await humanFixtureBody("f-small");
  const posture = motionActionContext(other, {}).entry.posture;
  const still: IAutoMovieMotionHumanActionPlan = {
    duration: 1,
    events: [],
    contacts: [],
    posture: () => posture,
  };
  TestValidator.equals(
    "an unread member",
    refused(() =>
      instance.plan(
        motionActionContext(
          body,
          { of: "b", duration: 1 },
          { partners: [{ subject: "b", body: other, plan: still }] },
        ),
      ),
    ),
    "of",
  );
}
