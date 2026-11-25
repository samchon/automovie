import { createWall } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanRefusal, planWallRun } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `planWallRun` runs a step up a wall's face and, for a run over it, reaches
 * the top from that step: a top beyond the hands' reach from the wall step,
 * `0.4 hip + shoulder + upper arm + forearm`, is refused.
 *
 * Scenarios, a performer standing 1 m before a full wall raised 1.5 m:
 *
 * 1. A run over its top is refused on `top`.
 */
export async function test_unit_motions_terrain_plan_wall_run(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const wall = HumanObject.prop("wall", createWall({ kind: "full" }), {
    position: { x: 0, y: 1.5, z: 1 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
    fixed: true,
  });
  let axis: string | undefined;
  try {
    planWallRun(
      motionActionContext(
        body,
        { kind: "run" as const, wall: "wall", face: "face", top: "top" },
        { props: [wall] },
      ),
    );
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.equals("a top out of reach", axis, "top");
}
