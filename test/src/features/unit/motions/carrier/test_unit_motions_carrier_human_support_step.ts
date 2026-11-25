import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal, HumanSupportStep } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `HumanSupportStep` steps from one support onto another at the height the walk
 * is planned at: an arrival more than `HumanSupportStepPlants.BEARING` above or
 * below it is refused.
 *
 * Scenarios, a performer standing on the floor:
 *
 * 1. An arrival 0.5 m up is refused on `to`.
 */
export async function test_unit_motions_carrier_human_support_step(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  let axis: string | undefined;
  try {
    HumanSupportStep(motionActionContext(body, { to: { x: 0, y: 0.5, z: 1 } }));
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.equals("an arrival off the level", axis, "to");
}
