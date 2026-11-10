import {
  AutoMoviePhysicalSimulation as Simulation,
  physicalNativeVector,
  samplePhysicalContactEvents,
  samplePhysicalTarget,
  trackPhysicalSupports,
} from "@automovie/engine";
import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Final composed native values are checked at transfer, while finite Float64 factors remain legal.
 *
 * Scenarios:
 * 1. Real rigid and compliant floor impulses refuse an unrepresentable response gain without explicit authored impulses.
 * 2. A native segment plus a legal local endpoint cannot pass an overflowing world point into velocityAtPoint.
 * 3. Very small finite scaled compliance retains the implicit rigid limit instead of infinity/infinity disappearing contacts.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation`, `physicalNativeVector`, `samplePhysicalContactEvents`, `samplePhysicalTarget` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate; 3 numbered scenarios (first: Real rigid and compliant floor impulses refuse an unrepresentable response gain without explicit authored...; last: Very small finite scaled compliance retains the implicit rigid limit instead of infinity/infinity...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (3 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Real rigid and compliant floor impulses refuse an unrepresentable response gain without explicit authored...; last: Very small finite scaled compliance retains the implicit rigid limit instead of infinity/infinity...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_native_transfer`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Real rigid and compliant floor impulses refuse an unrepresentable response gain without explicit authored impulses.).
 */
export async function test_physical_native_transfer(): Promise<void> {
  const legal: { x: number; y: number; z: number } = { x: 3e38, y: 2, z: 0 };
  assert.equal(physicalNativeVector(legal), legal);
  assert.throws(
    (): typeof legal => physicalNativeVector({ x: 4e38, y: 0, z: 0 }),
    /native vector/,
  );
  for (const compliance of [0, 0.001]) {
    const body: Simulation.IBody = PhysicalFixtures.body(
      "solid",
      PhysicalFixtures.sphere(0.1, compliance),
      1 / 120,
    );
    // The full dynamic selection carries the declared incoming trajectory's
    // one metre/second velocity at startup. An initial overlap alone does not
    // prove that a positive native impulse reached the transfer guard.
    for (const [index, target] of body.targets.entries()) {
      target.dynamicSegments = ["root"];
      target.segments.root!.position.y = 0.09 - index / 120;
    }
    body.mode = {
      kind: "exaggerated",
      gravity: 1,
      impulse: 1e100,
      compliance: 1,
      reason:
        "Actual solved impulse products are checked only when transferred",
    };
    const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
    input.floor = 0;
    input.gravity.y = -9.81;
    input.substeps = 1;
    Simulation.identity(input);
    const control: Simulation.IInput = structuredClone(input);
    const controlMode: (typeof control.bodies)[number]["mode"] =
      control.bodies[0]!.mode;
    if (controlMode.kind === "exaggerated") controlMode.impulse = 1;
    const observed: Simulation = await Simulation.compute(control);
    TestValidator.predicate(
      `real positive ${compliance === 0 ? "rigid" : "compliant"} floor transfer precedes the gain boundary`,
      observed.cache.contacts.some(
        (receipt: (typeof observed.cache.contacts)[number]): boolean =>
          receipt.source === "solver" &&
          (receipt.impulse ?? 0) > 0 &&
          (receipt.a.body === "floor" || receipt.b.body === "floor"),
      ),
    );
    await assert.rejects(Simulation.compute(input), /Derived native vector/);
  }
  const stiff: Simulation.IBody = PhysicalFixtures.body(
    "soft",
    PhysicalFixtures.sphere(0.1, 0.001),
    1 / 120,
  );
  for (const [index, target] of stiff.targets.entries()) {
    target.dynamicSegments = ["root"];
    target.segments.root!.position.y = 0.09 - index / 120;
  }
  stiff.mode = {
    kind: "exaggerated",
    gravity: 1,
    impulse: 1,
    compliance: 1e-297,
    reason: "A finite very stiff Kelvin-Voigt limit",
  };
  const input: Simulation.IInput = PhysicalFixtures.input([stiff], 1 / 120);
  input.floor = 0;
  input.gravity.y = -9.81;
  input.substeps = 1;
  const run: Simulation = await Simulation.compute(input);
  TestValidator.predicate(
    "very stiff finite compliance still produces a solved contact",
    run.cache.contacts.some(
      (contact: (typeof run.cache.contacts)[number]): boolean =>
        contact.source === "solver" && (contact.impulse ?? 0) > 0,
    ),
  );
  TestValidator.predicate(
    "the transferred stiff-limit response retains finite native velocity",
    Number.isFinite(run.cache.at(1 / 120).bodies.soft!.root!.velocity.y),
  );
  for (const invalid of [null, [], { a: -1, b: 0 }, { a: 0, b: Infinity }]) {
    const receipt: (typeof run.cache.contacts)[number] = structuredClone(
      run.cache.contacts[0]!,
    );
    Reflect.set(receipt.samples![0]!, "appliedImpulse", invalid);
    assert.throws(
      (): typeof run.cache.contacts => samplePhysicalContactEvents(receipt),
      /Invalid completed contact sample/,
    );
  }

  await RAPIER.init();
  const world: World = new RAPIER.World({ x: 0, y: 0, z: 0 });
  try {
    const body: Simulation.IBody = PhysicalFixtures.body(
      "large-point",
      PhysicalFixtures.sphere(),
      1 / 120,
    );
    body.targets[0]!.segments.root!.position.x = 2e38;
    const pose: (typeof body.targets)[number]["segments"][string] =
      body.targets[0]!.segments.root!;
    body.supportTracking = {
      pattern: {
        id: "one-point",
        minimumSupports: 0,
        limbs: [
          {
            bone: "root",
            chain: ["root"],
            localPoint: { x: 2e38, y: 0, z: 0 },
            phase: 0,
            duty: 1,
            offset: { forward: 0, left: 0 },
            stride: [],
          },
        ],
      },
      stiffness: 100,
      damping: 10,
      maximumForce: 100,
    };
    const rigid: RigidBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(2e38, 1, 0),
    );
    assert.throws(
      (): void =>
        trackPhysicalSupports({
          body,
          target: {
            ...body.targets[0]!,
            strength: 1,
            supportStrength: { root: 1 },
          },
          goals: { root: samplePhysicalTarget(pose, pose, 0, 120) },
          segments: new Map([["root", rigid]]),
          dt: 1 / 960,
          floor: -10,
          tolerance: 0.0001,
        }),
      /Derived native vector/,
    );
  } finally {
    world.free();
  }
}
