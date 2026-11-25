import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, dive } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `dive` falls to the floor caught on the hands from both feet on the floor.
 *
 * Scenarios:
 *
 * 1. Its record names it `dive`.
 * 2. An entry with both feet lifted is refused on `base`.
 */
export async function test_unit_motions_floor_dive(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const refused = (run: () => unknown): string | undefined => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  const standing = motionActionContext(body, {}).entry;
  const lifted = {
    ...standing,
    feet: {
      left: { ...standing.feet.left, planted: false },
      right: { ...standing.feet.right, planted: false },
    },
  };
  TestValidator.predicate("the record", dive.name === "dive");
  TestValidator.equals(
    "off its feet",
    refused(() =>
      dive.plan({ ...motionActionContext(body, {}), entry: lifted }),
    ),
    "base",
  );
}
