import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, HumanSurfaceGlide } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `HumanSurfaceGlide` glides over a surface for a positive duration at a
 * positive speed.
 *
 * Scenarios:
 *
 * 1. No duration is refused on `duration`, and no speed on `speed`.
 */
export async function test_unit_motions_carrier_human_surface_glide(): Promise<void> {
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
    "refusals",
    [
      refused(() =>
        HumanSurfaceGlide.plan(
          motionActionContext(body, { duration: 0, speed: 2 }),
        ),
      ),
      refused(() =>
        HumanSurfaceGlide.plan(
          motionActionContext(body, { duration: 2, speed: 0 }),
        ),
      ),
    ],
    ["duration", "speed"],
  );
}