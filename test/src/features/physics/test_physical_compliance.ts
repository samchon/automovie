import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures as Fixtures } from "../internal/PhysicalFixtures";

/** Real two-body contact sweep against independent momentum and displacement.
 *
 * Scenarios:
 * 1. A glancing air gap produces no contact impulse or target displacement.
 * 2. Incident speeds of 0.5, 1, 2 and 4 m/s each reach the compliant surface in one solved episode.
 * 3. After contact, the receiver's displacement rate measured from cached positions equals the receipt's impulse over its mass, the pair keeps the incident momentum, and the receiver ends between the perfectly inelastic and perfectly elastic outcomes.
 * 4. Greater speed increases measured impulse, compression and receiver displacement.
 * 5. Independent soft runs retain identical frames and per-step receipts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public `AutoMoviePhysicalSimulation` on in-memory scenes and reads its cached receipts and body positions. Missing or extra episodes, a geometric or impulse-free receipt, a receipt impulse that disagrees with the motion it caused, lost or created momentum, an energy-creating rebound, a nonmonotone response, nondeterminism and contact across an air gap each fail an assertion; any compliant law inside those physical bounds passes.
 * @evidence contracts/development/testing.md#independent-expectations Two one-kilogram frictionless spheres in zero gravity must conserve the striker's incident momentum, so the receiver's final velocity lies between half the incident speed (no rebound) and the full speed (elastic exchange). The receiver velocity is measured as a position difference over the post-contact cached interval, independently of the receipt; the 1e-3 relative allowance covers float32 native positions. The 1e-3 m/s momentum allowance covers float32 velocity rounding. The measurement makes no claim about the compliant law's restitution value.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a bounded four-speed sweep, a glancing miss and a repeated run. Paired hit, blocked and missed attribution belongs to test_physical_native_contact_pair; joint compliance deadlines belong to test_physical_impulse_compliance.
 * @evidence contracts/development/testing.md#execution-ownership Portable unit test entered through the discoverable function `test_physical_compliance`, running the public engine with native WASM on in-memory inputs; it registers no dynamic cases and starts no process, viewer or render host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios, naming the sweep, the independent momentum, displacement and energy bounds, and the miss and determinism cases.
 */
export async function test_physical_compliance(): Promise<void> {
  const duration: number = 1.5;
  const observations: {
    speed: number;
    impulse: number;
    compression: number;
    displacement: number;
  }[] = [];
  for (const speed of [0.5, 1, 2, 4]) {
    const input: IAutoMoviePhysicalSimulationInput.IInput = scene(speed);
    const run: IAutoMoviePhysicalSimulation = await Simulation.compute(input);
    const contacts: readonly IAutoMovieContactReceipt[] = run.cache.contacts;
    TestValidator.predicate(
      `speed ${speed} has one actual solved contact`,
      contacts.length === 1 &&
        new Set([contacts[0]!.a.body, contacts[0]!.b.body]).size === 2 &&
        [contacts[0]!.a.body, contacts[0]!.b.body].every(
          (id: string): boolean => id === "receiver" || id === "striker",
        ) &&
        contacts[0]!.source === "solver" &&
        contacts[0]!.samples!.length > 0 &&
        contacts[0]!.impulse! > 0 &&
        contacts[0]!.separation <= 0,
    );
    const receipt: IAutoMovieContactReceipt = contacts[0]!;
    const after: number = receipt.endSeconds + 2 / input.rate;
    const position: (seconds: number, body: string) => number = (
      seconds: number,
      body: string,
    ): number => run.cache.at(seconds).bodies[body]!.root!.position.x;
    const velocity: (body: string) => number = (body: string): number =>
      run.cache.at(duration).bodies[body]!.root!.velocity.x;
    const rate: number =
      (position(duration, "receiver") - position(after, "receiver")) /
      (duration - after);
    const receiver: number = velocity("receiver");
    TestValidator.predicate(
      `speed ${speed} receipt impulse matches the displacement it caused`,
      after < duration &&
        Math.abs(rate - receipt.impulse!) < 1e-3 * receipt.impulse!,
    );
    TestValidator.predicate(
      `speed ${speed} keeps momentum within inelastic and elastic bounds`,
      Math.abs(receiver + velocity("striker") - speed) < 1e-3 &&
        receiver >= speed / 2 - 1e-3 &&
        receiver <= speed + 1e-3,
    );
    observations.push({
      speed,
      impulse: receipt.impulse!,
      compression: receipt.compression,
      displacement: position(duration, "receiver") - 0.3,
    });
    if (speed === 1) {
      const repeat: IAutoMoviePhysicalSimulation =
        await Simulation.compute(input);
      TestValidator.equals(
        "soft solver deterministic frames and contacts",
        JSON.stringify([run.cache.frames, run.cache.contacts]),
        JSON.stringify([repeat.cache.frames, repeat.cache.contacts]),
      );
      const miss: IAutoMoviePhysicalSimulationInput.IInput =
        structuredClone(input);
      for (const target of miss.bodies[1]!.targets)
        target.segments.root!.position.z = 0.21;
      const air: IAutoMoviePhysicalSimulation = await Simulation.compute(miss);
      TestValidator.predicate(
        "air gap creates no receipt or reaction",
        air.cache.contacts.length === 0 &&
          Math.abs(air.cache.at(duration).bodies.receiver!.root!.velocity.x) <
            1e-8,
      );
    }
  }
  TestValidator.predicate(
    "speed sweep increases real impulse, compression and displacement",
    observations.every(
      (observation: (typeof observations)[number], index: number): boolean =>
        observation.compression > 0 &&
        (index === 0 ||
          (observation.impulse > observations[index - 1]!.impulse &&
            observation.compression > observations[index - 1]!.compression &&
            observation.displacement > observations[index - 1]!.displacement)),
    ),
  );

  /** A one-kilogram soft striker launched at the given speed toward a resting twin 0.6 m away. */
  function scene(speed: number): IAutoMoviePhysicalSimulationInput.IInput {
    const profile: P = Fixtures.sphere(0.1, 0.001);
    const input: IAutoMoviePhysicalSimulationInput.IInput = Fixtures.input(
      [
        Fixtures.body("striker", profile, duration, {
          position: { x: -0.3, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
        Fixtures.body("receiver", profile, duration, {
          position: { x: 0.3, y: 1, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        }),
      ],
      duration,
    );
    input.impulses.push({
      step: 1,
      body: "striker",
      bone: "root",
      point: { x: -0.3, y: 1, z: 0 },
      impulse: { x: speed, y: 0, z: 0 },
    });
    return input;
  }
}
