import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanMediumWalk, HumanRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `HumanMediumWalk` walks through a medium; in water the depth must be above 0
 * and no deeper than the chest.
 *
 * Scenarios:
 *
 * 1. Water 3 m deep, and water 0 m deep, are refused on `medium.depth`.
 */
export async function test_unit_motions_carrier_human_medium_walk(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const refused = (run: () => unknown): string | undefined => {
    try {
      run();
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  const walk = (depth: number) =>
    HumanMediumWalk(
      motionActionContext(body, {
        to: { x: 0, y: 0, z: 2 },
        medium: { kind: "water" as const, depth },
      }),
    );
  TestValidator.equals(
    "the depth",
    [refused(() => walk(3)), refused(() => walk(0))],
    ["medium.depth", "medium.depth"],
  );
}