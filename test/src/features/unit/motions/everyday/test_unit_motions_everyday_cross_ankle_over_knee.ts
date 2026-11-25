import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, crossAnkleOverKnee } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `crossAnkleOverKnee` lifts one ankle onto the other knee from a seated entry
 * with both feet on the ground, and refuses any other base.
 *
 * Scenarios:
 *
 * 1. A standing entry is refused on `base`.
 */
export async function test_unit_motions_everyday_cross_ankle_over_knee(): Promise<void> {
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
    "a standing entry",
    refused(() =>
      crossAnkleOverKnee.plan(
        motionActionContext(body, { side: "left" as const }),
      ),
    ),
    "base",
  );
}
