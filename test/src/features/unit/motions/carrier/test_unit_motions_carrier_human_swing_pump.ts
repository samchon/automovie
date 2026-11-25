import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, HumanSwingPump } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `HumanSwingPump` pumps a swing by leaning the trunk back and forth up to 45
 * degrees from the seat it sits on.
 *
 * Scenarios:
 *
 * 1. A 60 degree lean is refused on `lean` before the swing is read.
 */
export async function test_unit_motions_carrier_human_swing_pump(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  let axis: string | undefined;
  try {
    HumanSwingPump(
      motionActionContext(body, {
        on: "swing",
        seat: "seat",
        hands: {},
        duration: 4,
        lean: 60,
      }),
    );
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.equals("too far a lean", axis, "lean");
}
