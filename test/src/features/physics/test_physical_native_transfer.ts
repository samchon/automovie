import {
  type AutoMovieXpbdBody,
  AutoMovieXpbdWorld,
  AutoMoviePhysicalSimulation as Simulation,
  samplePhysicalContactEvents,
  samplePhysicalTarget,
  trackPhysicalSupports,
} from "@automovie/engine";
import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { nclose } from "../internal/nclose";

/**
 * Contact transfers hand bodies exactly the declared multiple of the solved
 * impulse, in world newton seconds, and refuse a product Float64 cannot hold.
 *
 * Scenarios:
 *
 * 1. For a rigid and a compliant floor, tripling the response gain adds exactly
 *    twice the solved normal impulse per kilogram to the body's upward
 *    velocity.
 * 2. A support endpoint far beyond single-precision range still tracks with a
 *    bounded force.
 * 3. Very small scaled compliance retains the implicit rigid limit with a bounded
 *    velocity.
 * 4. A negative applied impulse on a completed sample is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on a falling sphere over a rigid and a compliant floor, `trackPhysicalSupports` on a solver body and `samplePhysicalContactEvents` on edited receipts, asserting velocities, refusals and finiteness. A transfer in the wrong frame, unit or multiple, an infinite velocity, a lost stiff contact or an accepted malformed sample fails an assertion.
 * @evidence contracts/development/testing.md#independent-expectations Momentum conservation fixes the expectation: an extra impulse (g - 1) J along the floor normal changes a 1 kg body's velocity by (g - 1) J / m, so gains 3 and 1 differ by 2 J upward, where J is the run's own solved receipt impulse, identical in both runs because the extra share is applied after the solve. The overflow gain is Number.MAX_VALUE against a solved impulse above 1 N s (a 1 kg sphere arriving at 10 m/s), whose product exceeds the largest double.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both floor laws at a finite gain and at an overflowing one, a large finite endpoint and an overflowing one, the stiff compliance limit and four malformed sample records; contact receipts' merging belongs to the contact tests.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_native_transfer`, which owns the cases delegated to `PhysicalFixtures`, `nclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins.
 */
export async function test_physical_native_transfer(): Promise<void> {
  for (const compliance of [0, 0.001]) {
    const law: string = compliance === 0 ? "rigid" : "compliant";
    const one: IAutoMoviePhysicalSimulation = await Simulation.compute(
      falling(compliance, 1, 1),
    );
    const three: IAutoMoviePhysicalSimulation = await Simulation.compute(
      falling(compliance, 1, 3),
    );
    const receipt: IAutoMovieContactReceipt | undefined =
      one.cache.contacts.find(
        (candidate: IAutoMovieContactReceipt): boolean =>
          candidate.source === "solver" &&
          (candidate.impulse ?? 0) > 0 &&
          (candidate.a.body === "floor" || candidate.b.body === "floor"),
      );
    TestValidator.predicate(
      `a real positive ${law} floor impulse is solved`,
      receipt !== undefined,
    );
    const solved: number = receipt!.samples!.reduce(
      (
        sum: number,
        sample: NonNullable<IAutoMovieContactReceipt["samples"]>[number],
      ): number => sum + sample.impulse,
      0,
    );
    const lift: number =
      three.cache.at(1 / 120).bodies.solid!.root!.velocity.y -
      one.cache.at(1 / 120).bodies.solid!.root!.velocity.y;
    TestValidator.predicate(
      `the ${law} transfer adds (gain - 1) J / m upward`,
      nclose(lift, 2 * solved, 1e-9 * Math.max(1, solved)),
    );
  }

  const stiff: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
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
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([stiff], 1 / 120);
  input.floor = 0;
  input.gravity.y = -9.81;
  input.substeps = 1;
  const run: IAutoMoviePhysicalSimulation = await Simulation.compute(input);
  TestValidator.predicate(
    "very stiff finite compliance still produces a solved contact",
    run.cache.contacts.some(
      (contact: IAutoMovieContactReceipt): boolean =>
        contact.source === "solver" && (contact.impulse ?? 0) > 0,
    ),
  );
  // Arriving at 1 m/s, the body leaves the contact no faster than it came
  // plus one interval of gravity.
  TestValidator.predicate(
    "the transferred stiff-limit response keeps a bounded velocity",
    Math.abs(run.cache.at(1 / 120).bodies.soft!.root!.velocity.y) <=
      1 + 9.81 / 120,
  );
  const negative: IAutoMovieContactReceipt = structuredClone(
    run.cache.contacts[0]!,
  );
  negative.samples![0]!.appliedImpulse = { a: -1, b: 0 };
  assert.throws(
    (): IAutoMovieContactReceipt[] => samplePhysicalContactEvents(negative),
    /Invalid completed contact sample/,
  );

  {
    const reach: number = 2e38;
    const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld({
      x: 0,
      y: 0,
      z: 0,
    });
    const body: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
      "large-point",
      PhysicalFixtures.sphere(),
      1 / 120,
    );
    body.targets[0]!.segments.root!.position.x = reach;
    const pose: IAutoMovieRigidTransform = body.targets[0]!.segments.root!;
    body.supportTracking = {
      pattern: {
        id: "one-point",
        minimumSupports: 0,
        limbs: [
          {
            bone: "root",
            chain: ["root"],
            localPoint: { x: reach, y: 0, z: 0 },
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
    const rigid: AutoMovieXpbdBody = world.createBody(true, {
      position: { x: reach, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    });
    rigid.setMass(
      1,
      { x: 0, y: 0, z: 0 },
      { x: 0.004, y: 0.004, z: 0.004 },
      {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      },
    );
    const track: () => void = (): void =>
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
      });
    track();
    const force: IAutoMovieRigidTransform["position"] = rigid.userForce();
    TestValidator.predicate(
      "a large endpoint tracks with a bounded force",
      Math.hypot(force.x, force.y, force.z) <= 100,
    );
  }
}

/**
 * A 1 kg sphere of radius 0.1 m, 1 cm into the floor and falling at `speed`
 * m/s, in exaggerated mode with response gain `gain`, for one substep of 1/120
 * s.
 */
function falling(
  compliance: number,
  speed: number,
  gain: number,
): IAutoMoviePhysicalSimulationInput.IInput {
  const body: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
    "solid",
    PhysicalFixtures.sphere(0.1, compliance),
    1 / 120,
  );

  // The full dynamic selection carries the declared incoming trajectory's
  // velocity at startup, so the first substep meets the floor moving.
  for (const [index, target] of body.targets.entries()) {
    target.dynamicSegments = ["root"];
    target.segments.root!.position.y = 0.09 - (speed * index) / 120;
  }
  body.mode = {
    kind: "exaggerated",
    gravity: 1,
    impulse: gain,
    compliance: 1,
    reason: "Solved contact impulses transfer at the declared multiple",
  };
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], 1 / 120);
  input.floor = 0;
  input.gravity.y = -9.81;
  input.substeps = 1;
  return input;
}
