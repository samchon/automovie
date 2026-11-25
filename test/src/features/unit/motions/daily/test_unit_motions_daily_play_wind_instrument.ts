import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, playWindInstrument } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `playWindInstrument` brings a held instrument's mouthpiece to the mouth and
 * plays it.
 *
 * Scenarios:
 *
 * 1. With no instrument held or staged the request is refused.
 */
export async function test_unit_motions_daily_play_wind_instrument(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const refused = (run: () => unknown): string | undefined => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  TestValidator.predicate(
    "nothing held",
    refused(() =>
      playWindInstrument.plan(motionActionContext(body, { prop: "flute" })),
    ) !== undefined,
  );
}
