import { createSwing } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanRefusal, HumanSwingLeap } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `HumanSwingLeap` leaps off a swing from where its seat carries the pelvis,
 * and lands below it: a pelvis lower than the landing height is refused.
 *
 * Scenarios, a performer standing beside a swing staged at the origin:
 *
 * 1. A leap onto ground 3 m up, above the pelvis, is refused on `on`.
 */
export async function test_unit_motions_carrier_human_swing_leap(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const swing = HumanObject.prop("swing", createSwing(), {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
    fixed: true,
  });
  let axis: string | undefined;
  try {
    HumanSwingLeap(
      motionActionContext(body, { on: "swing", ground: 3 }, { props: [swing] }),
    );
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.equals("a landing above the pelvis", axis, "on");
}
