import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, roll } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `roll` crouches from both feet on the floor and rolls.
 *
 * Scenarios:
 *
 * 1. Its record names it `roll`.
 * 2. An entry with both feet lifted is refused on `base`.
 */
export async function test_unit_motions_floor_roll(): Promise<void> {
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
  TestValidator.predicate("the record", roll.name === "roll");
  TestValidator.equals(
    "off its feet",
    refused(() =>
      roll.plan({ ...motionActionContext(body, {}), entry: lifted }),
    ),
    "base",
  );
}
