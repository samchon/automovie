import { createKerb, createLadder } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanLadder,
  HumanRefusal,
  planLadderAccess,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `planLadderAccess` steps off a ladder onto a named landing, which must be a
 * fixed surface of the landing prop with a width and a depth.
 *
 * Scenarios, a ladder 0.5 m ahead and a kerb beside it:
 *
 * 1. A landing on a point the kerb does not declare as a surface is refused on
 *    `landing.point`.
 */
export async function test_unit_motions_climbing_plan_ladder_access(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const ladder = HumanObject.prop("ladder", createLadder({ kind: "fixed" }), {
    position: { x: 0, y: 0, z: 0.5 },
    rotation: Quaternion.identity(),
    fixed: true,
  });
  const kerb = HumanObject.prop("kerb", createKerb({ kind: "kerb" }), {
    position: { x: 1, y: 0, z: 0.5 },
    rotation: Quaternion.identity(),
    fixed: true,
  });
  const landing = { prop: "kerb", point: "missing" };
  const context = motionActionContext(
    body,
    { ladder: "ladder", landing },
    { props: [ladder, kerb] },
  );
  let axis: string | undefined;
  try {
    planLadderAccess(context, HumanLadder(context, "ladder"), landing);
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.equals("an undeclared landing", axis, "landing.point");
}
