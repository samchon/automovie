import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures as Fixtures } from "../internal/PhysicalFixtures";

/** Explicit policy changes real response rather than changing an action label.
 *
 * Scenarios:
 * 1. A kinematic moving collider transfers momentum to a simulated receiver.
 * 2. A declared three-times impulse policy changes the first actual response.
 * 3. A fully kinematic scene performs no dynamics steps and retains authored poses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate; 3 numbered scenarios (first: A kinematic moving collider transfers momentum to a simulated receiver.; last: A fully kinematic scene performs no dynamics steps and retains authored poses.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (3 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A kinematic moving collider transfers momentum to a simulated receiver.; last: A fully kinematic scene performs no dynamics steps and retains authored poses.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_modes`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A kinematic moving collider transfers momentum to a simulated receiver.).
 */
export async function test_physical_modes(): Promise<void> {
  const velocities: number[] = [];
  for (const gain of [1, 3]) {
    const a: Simulation.IBody = Fixtures.body("driver", Fixtures.sphere(), 1);
    a.mode = { kind: "kinematic" };
    for (const [step, target] of a.targets.entries())
      target.segments.root!.position.x = -0.3 + step / 120;
    const b: Simulation.IBody = Fixtures.body("receiver", Fixtures.sphere(), 1);
    for (const target of b.targets) target.segments.root!.position.x = 0.3;
    b.mode =
      gain === 1
        ? { kind: "simulated" }
        : {
            kind: "exaggerated",
            impulse: gain,
            gravity: 1,
            compliance: 1,
            reason: "Explicit response-policy comparison",
          };
    const run: Simulation = await Simulation.compute(Fixtures.input([a, b], 1));
    const first: (typeof run.cache.frames)[number] | undefined =
      run.cache.frames.find(
        (frame: (typeof run.cache.frames)[number]): boolean =>
          frame.bodies.receiver!.root!.velocity.x > 0.01,
      );
    TestValidator.predicate(
      "mixed boundary has actual momentum transfer",
      first !== undefined && run.cache.contacts.length > 0,
    );
    velocities.push(first!.bodies.receiver!.root!.velocity.x);
  }
  TestValidator.predicate(
    "declared three-times contact response",
    Math.abs(velocities[1]! / velocities[0]! - 3) < 1e-4,
  );
  const authored: Simulation.IBody = Fixtures.body(
    "authored",
    Fixtures.sphere(),
    1,
  );
  authored.mode = { kind: "kinematic" };
  const run: Simulation = await Simulation.compute(
    Fixtures.input([authored], 1),
  );
  TestValidator.predicate(
    "kinematic scene never advances dynamics",
    run.recomputedSteps === 0 &&
      run.cache.at(1).bodies.authored!.root!.position.y === 1 &&
      run.cache.contacts.length === 0,
  );
}
