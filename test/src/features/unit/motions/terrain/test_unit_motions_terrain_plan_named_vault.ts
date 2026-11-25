import { createKerb } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanFrame,
  HumanRefusal,
  planNamedVault,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `planNamedVault` crosses a raised support on a hand and the feet only when
 * its near side lies ahead within the hip height and its top is above the floor
 * and no higher than half the hip height.
 *
 * Scenarios, a performer standing at the origin facing +Z:
 *
 * 1. A kerb 1 m behind is refused on `over.point`.
 */
export async function test_unit_motions_terrain_plan_named_vault(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const kerb = HumanObject.prop("kerb", createKerb({ kind: "kerb" }), {
    position: { x: 0, y: 0, z: -1 },
    rotation: Quaternion.identity(),
    fixed: true,
  });
  const context = motionActionContext(
    body,
    { kind: "vault" as const, over: { prop: "kerb", point: "top" } },
    { props: [kerb] },
  );
  let axis: string | undefined;
  try {
    planNamedVault(
      context,
      HumanFrame.prepare({ origin: { x: 0, y: 0, z: 0 }, yaw: 0 }),
      { prop: "kerb", point: "top" },
      "right",
    );
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.equals("a support behind", axis, "over.point");
}
