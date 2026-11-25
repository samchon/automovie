import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, armPhrase } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `armPhrase` is an overlay phrase of one or both arms: it refuses a phrase on a
 * held prop the hand does not hold, and a point on a prop with no prop held.
 *
 * Scenarios, a standing performer holding nothing visiting a point ahead:
 *
 * 1. Its record names it `armPhrase` and lays it over a carrier.
 * 2. A visit with the right hand on a held `cup` is refused on `held`, and one
 *    naming a `rim` point with no prop held on `point`.
 */
export async function test_unit_motions_everyday_arm_phrase(): Promise<void> {
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
    armPhrase.name === "armPhrase" && armPhrase.overlay === true,
  );
  const target = {
    kind: "point" as const,
    at: { x: 0, y: 1.2, z: 0.5 },
    frame: "world" as const,
  };
  TestValidator.equals(
    "refusals",
    [
      refused(() =>
        armPhrase.plan(
          motionActionContext(body, {
            phrase: "visit" as const,
            target,
            hand: "right" as const,
            held: "cup",
          }),
        ),
      ),
      refused(() =>
        armPhrase.plan(
          motionActionContext(body, {
            phrase: "visit" as const,
            target,
            hand: "right" as const,
            point: "rim",
          }),
        ),
      ),
    ],
    ["held", "point"],
  );
}