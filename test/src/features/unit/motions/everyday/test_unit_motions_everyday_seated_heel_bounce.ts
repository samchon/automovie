import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, seatedHeelBounce } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `seatedHeelBounce` bounces one heel a whole number of beats at a cadence from
 * a seated entry.
 *
 * Scenarios:
 *
 * 1. Its record names it `seatedHeelBounce`.
 * 2. No beat is refused on `count`, and a standing entry on `base`.
 */
export async function test_unit_motions_everyday_seated_heel_bounce(): Promise<void> {
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
    "the record",
    seatedHeelBounce.name === "seatedHeelBounce",
  );
  const params = (count: number) => ({
    side: "left" as const,
    count,
    cadence: 2,
    amplitude: 10,
  });
  TestValidator.equals(
    "refusals",
    [
      refused(() =>
        seatedHeelBounce.plan(motionActionContext(body, params(0))),
      ),
      refused(() =>
        seatedHeelBounce.plan(motionActionContext(body, params(4))),
      ),
    ],
    ["count", "base"],
  );
}
