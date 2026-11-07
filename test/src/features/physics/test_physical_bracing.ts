import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalBalance as Balance } from "../../../../packages/engine/src/physics/AutoMoviePhysicalBalance";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { physicalBalanceBracing } from "../../../../packages/engine/src/physics/physicalBalanceBracing";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Bounded effort survives prediction/step failure while the body can still stand.
 *
 * Scenarios:
 * 1. Capture correction points into the actual polygon and obeys its travel cap.
 * 2. A failed step keeps effort above the recovery height; collapse withdraws it.
 * 3. A real primitive body actively resists an impulse while its released twin falls.
 */
export async function test_physical_bracing(): Promise<void> {
  const point: IAutoMovieVector3 = { x: 2, y: 0, z: 0 };
  const assessment: Balance.IResult = {
    state: "unrecoverable",
    capturePoint: point,
    outside: 1.5,
    polygon: [
      { x: -0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: -0.5 },
      { x: 0.5, y: 0, z: 0.5 },
      { x: -0.5, y: 0, z: 0.5 },
    ],
  };
  const common: Omit<Parameters<typeof physicalBalanceBracing>[0], "center"> = {
    assessment,
    floor: 0,
    minimumCenterHeight: 0.4,
    maximumRootShift: 0.2,
    exhausted: true,
  };
  const standing: ReturnType<typeof physicalBalanceBracing> =
    physicalBalanceBracing({ ...common, center: { x: 0, y: 1, z: 0 } });
  const fallen: ReturnType<typeof physicalBalanceBracing> =
    physicalBalanceBracing({ ...common, center: { x: 0, y: 0.3, z: 0 } });
  TestValidator.predicate(
    "standing effort and bounded physical correction",
    standing.rootStrength === 1 &&
      Math.abs(standing.shift.x + 0.2) < 1e-12 &&
      standing.shift.y === 0 &&
      Math.abs(standing.shift.z) < 1e-12,
  );
  TestValidator.equals(
    "only measured collapse after exhausted recovery withdraws",
    fallen.rootStrength,
    0,
  );
  const heights: number[] = [];
  for (const active of [true, false]) {
    const body: Simulation.IBody = PhysicalSupportFixtures.body(
      PhysicalModelFixtures.quadrupod(),
      2,
    );
    if (active)
      body.balance!.bracing = {
        minimumCenterHeight: 0.4,
        maximumRootShift: 0.2,
      };
    else {
      body.balance = undefined;
      for (const target of body.targets) target.strength = 0;
    }
    const input: Simulation.IInput = PhysicalFixtures.input([body], 2);
    input.floor = 0;
    input.gravity.y = -9.81;
    input.impulses.push({
      step: 30,
      body: body.id,
      bone: "body",
      point: { x: 0, y: 1.05, z: 0 },
      impulse: { x: 3, y: 0, z: 0 },
    });
    const run: Simulation = await Simulation.compute(input);
    heights.push(run.cache.at(2).bodies[body.id]!.body!.position.y);
  }
  TestValidator.predicate(
    "actual active resistance differs from passive fall",
    heights[0]! > 0.8 && heights[1]! < heights[0]! - 0.1,
  );
}
