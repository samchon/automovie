import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, look } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `look` turns the eyes, head and trunk to a target. An uncued target outside
 * the attended field is refused, so a look behind needs the cue that draws it.
 *
 * Scenarios, a performer standing at the origin facing +Z:
 *
 * 1. Its record names it `look`.
 * 2. An uncued look at a point 3 m behind is refused on `cue`.
 */
export async function test_unit_motions_everyday_look(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const refused = (run: () => unknown): string | undefined => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  TestValidator.predicate("the record", look.name === "look");
  TestValidator.equals(
    "an uncued look behind",
    refused(() =>
      look.plan(
        motionActionContext(body, {
          target: {
            kind: "point" as const,
            at: { x: 0, y: 1.6, z: -3 },
            frame: "world" as const,
          },
        }),
      ),
    ),
    "cue",
  );
}
