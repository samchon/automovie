import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";

/**
 * Finite floor boundaries are explicit budgets, with admission and runtime escape refusals.
 */
export async function test_unit_engine_physics_physical_floor_domain(): Promise<void> {
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input(
      [PhysicalFixtures.body("ball", PhysicalFixtures.sphere(), 1)],
      1,
    );
  input.floorBounds = {
    min: { x: -1, z: -1 },
    max: { x: 1, z: 1 },
    thickness: 1,
  };
  const invalid: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  invalid.floorBounds.thickness = 0;
  const authored: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  authored.bodies[0]!.mode = { kind: "kinematic" };
  authored.bodies[0]!.targets[1]!.segments.root!.position.x = 2;
  const escaping: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  escaping.impulses.push({
    step: 1,
    body: "ball",
    bone: "root",
    impulse: { x: 3, y: 0, z: 0 },
    point: { x: 0, y: 1, z: 0 },
  });
  const refusals: string[] = [];
  for (const scenario of [invalid, authored, escaping]) {
    try {
      await Simulation.compute(scenario);
      refusals.push("unexpected success");
    } catch (error: unknown) {
      refusals.push(String(error));
    }
  }
  TestValidator.predicate(
    "all malformed or escaped floor cases refuse with their cause",
    refusals[0]!.includes("bounds or thickness") &&
      refusals[1]!.includes("target outside physical floor domain") &&
      refusals[2]!.includes("Physical floor domain exceeded"),
  );
}
