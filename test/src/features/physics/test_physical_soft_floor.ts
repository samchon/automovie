import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/**
 * A real soft floor contact balances mg/k, respects its rigid core and resumes with an independent fixed floor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; the behavior its summary names. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes the behavior its summary names, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_soft_floor`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A real soft floor contact balances mg/k, respects its rigid core and resumes with an independent fixed floor) as stated in this comment.
 */
export async function test_physical_soft_floor(): Promise<void> {
  const body: Simulation.IBody = PhysicalFixtures.body(
    "soft",
    PhysicalFixtures.sphere(0.1, 0.001),
    2,
  );
  const input: Simulation.IInput = PhysicalFixtures.input([body], 2);
  input.floor = 0;
  input.gravity.y = -9.81;
  const baseline: Simulation = await Simulation.compute(input);
  const edited: Simulation.IInput = structuredClone(input);
  edited.impulses.push({
    step: 180,
    body: "soft",
    bone: "root",
    point: { x: 0, y: 0.09019, z: 0 },
    impulse: { x: 0.1, y: 0, z: 0 },
  });
  const resumed: Simulation = await Simulation.compute(edited, baseline);
  const fresh: Simulation = await Simulation.compute(edited);
  const finalHeight: number =
    baseline.cache.at(2).bodies.soft!.root!.position.y;
  const maximumCompression: number = Math.max(
    0,
    ...baseline.cache.contacts.map(
      (receipt: (typeof baseline.cache.contacts)[number]): number =>
        receipt.compression,
    ),
  );
  const failures: string[] = [];
  if (Math.abs(finalHeight - (0.1 - 0.001 * 9.81)) > 0.002)
    failures.push(`spring equilibrium ${finalHeight}`);
  if (!(maximumCompression > 0 && maximumCompression <= 0.035))
    failures.push(`rigid core compression ${maximumCompression}`);
  if (
    resumed.recomputedSteps !== 120 ||
    JSON.stringify(resumed.cache.frames) !==
      JSON.stringify(fresh.cache.frames) ||
    JSON.stringify(resumed.cache.contacts) !==
      JSON.stringify(fresh.cache.contacts)
  )
    failures.push(
      "soft floor checkpoint differs from a complete independent run",
    );
  TestValidator.equals(
    "all soft floor equilibrium and checkpoint observations",
    failures,
    [],
  );
}
