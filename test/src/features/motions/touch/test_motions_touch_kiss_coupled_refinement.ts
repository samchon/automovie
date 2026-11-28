import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanRefusal } from "@automovie/motions";
import assert from "node:assert/strict";

import { HumanTrunk } from "../../../../../packages/motions/src/everyday/internal/HumanTrunk";
import { HumanFoot } from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { prepareHumanPoseResolution } from "../../../../../packages/motions/src/posture/internal/prepareHumanPoseResolution";
import { kiss } from "../../../../../packages/motions/src/touch/internal/kiss";
import { kissPose } from "../../../../../packages/motions/src/touch/internal/kissPose";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/**
 * A standing cheek contact reaches a target between integer candidate angles.
 *
 * Scenarios:
 *
 * 1. Resolve the mouth within 5 mm of a fixed reachable world point.
 * 2. Repeat the solve and check that all four chosen angles are reproducible.
 * 3. Place the same target 0.7 m farther away and require a reach refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios state the contact distance, repeatability and refusal conditions.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the defining kiss law on a stored rig and verifies its placed mouth through the pose resolver.
 * @evidence contracts/development/testing.md#independent-expectations The target was fixed from a preselected reachable pose, before calling the fitter. A separate 0.7 m displacement exceeds the standing reach.
 */
export async function test_motions_touch_kiss_coupled_refinement(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const entry: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const stance: IAutoMovieMotionHumanRise.Stance = {
    left: HumanFoot.pivot(
      body,
      "left",
      "ball",
      { x: 0.1, y: 0, z: 0.125 },
      0,
      0,
    ),
    right: HumanFoot.pivot(
      body,
      "right",
      "ball",
      { x: -0.1, y: 0, z: 0.125 },
      0,
      0,
    ),
  };

  // Mouth at 25° pitch, 4.5° roll, -43° neck flexion and 25° heel lift on
  // this body, with the cheek action's 30° head turn.
  const target: IAutoMovieVector3 = {
    x: -0.03612648137409652,
    y: 1.7062896460875203,
    z: 0.3946929791687313,
  };
  const solve = (point: IAutoMovieVector3): IAutoMovieMotionHumanKiss.ISolved =>
    kiss.solve({ body }, entry, stance, 30, point);
  const fitted: IAutoMovieMotionHumanKiss.ISolved = solve(target);
  const displayed: IAutoMovieVector3 = HumanTrunk.preparePoint(body, "mouth")(
    kissPose(body, entry, stance, 30, false)(fitted),
    prepareHumanPoseResolution(),
  );
  const gap: number = AutoMovieEngineVector3.distance(displayed, target);
  assert.ok(gap <= 0.005, `The resolved mouth misses by ${gap} m`);
  kiss.admitReach("cheekLeft", fitted);

  const repeated: IAutoMovieMotionHumanKiss.ISolved = solve(target);
  for (const angle of ["pitch", "roll", "flexion", "raise"] as const)
    assert.ok(nclose(fitted[angle], repeated[angle], 1e-12), angle);

  assert.throws(
    () => kiss.admitReach("cheekLeft", solve({ ...target, z: target.z + 0.7 })),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal &&
      error.kind === "reach" &&
      error.axis === "region",
  );
}
