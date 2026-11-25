import { createRoundabout } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanRefusal, HumanRoundaboutPush } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `HumanRoundaboutPush` runs beside a roundabout pushing one of its grab bars,
 * and admits the bar before it plans the walk.
 *
 * Scenarios, a roundabout staged 1 m ahead:
 *
 * 1. A push on a `missing` bar the disc does not declare is refused on `bar`.
 */
export async function test_unit_motions_carrier_human_roundabout_push(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const disc = HumanObject.prop("disc", createRoundabout(), {
    position: { x: 0, y: 0, z: 1 },
    rotation: Quaternion.identity(),
    fixed: true,
  });
  let axis: string | undefined;
  try {
    HumanRoundaboutPush(
      motionActionContext(
        body,
        {
          to: { x: 1, y: 0, z: 1 },
          on: "disc",
          bar: "missing",
          hand: "right" as const,
        },
        { props: [disc] },
      ),
    );
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.equals("an undeclared bar", axis, "bar");
}
