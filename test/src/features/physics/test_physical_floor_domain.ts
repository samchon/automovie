import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/**
 * Finite floor boundaries are explicit budgets, with admission and runtime escape refusals.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 1x TestValidator.predicate; the behavior its summary names. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (1 assertion site compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes the behavior its summary names, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_floor_domain`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Finite floor boundaries are explicit budgets, with admission and runtime escape refusals) as stated in this comment.
 */
export async function test_physical_floor_domain(): Promise<void> {
  const input: Simulation.IInput = PhysicalFixtures.input(
    [PhysicalFixtures.body("ball", PhysicalFixtures.sphere(), 1)],
    1,
  );
  input.floorBounds = {
    min: { x: -1, z: -1 },
    max: { x: 1, z: 1 },
    thickness: 1,
  };
  const invalid: Simulation.IInput = structuredClone(input);
  invalid.floorBounds.thickness = 0;
  const authored: Simulation.IInput = structuredClone(input);
  authored.bodies[0]!.mode = { kind: "kinematic" };
  authored.bodies[0]!.targets[1]!.segments.root!.position.x = 2;
  const escaping: Simulation.IInput = structuredClone(input);
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
