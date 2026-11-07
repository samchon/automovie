import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures as Fixtures } from "../internal/PhysicalFixtures";

/** Explicit policy changes real response rather than changing an action label.
 *
 * Scenarios:
 * 1. A kinematic moving collider transfers momentum to a simulated receiver.
 * 2. A declared three-times impulse policy changes the first actual response.
 * 3. A fully kinematic scene performs no dynamics steps and retains authored poses.
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
