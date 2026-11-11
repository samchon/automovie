import {
  AutoMoviePhysicalSimulation as Simulation,
  samplePhysicalTrackingTarget,
} from "@automovie/engine";
import type { IAutoMovieContactReceipt as Receipt } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Actual contact controls withdrawal, and the transition survives a checkpoint.
 *
 * Scenarios:
 * 1. An incoming sphere physically contacts a tracked sphere and releases it.
 * 2. A miss leaves the receiver tracked, and later episode impulses are causal.
 * 3. A late edit resumes contact-triggered passive motors with identical frames.
 * 4. Protective joint effort is selected after contact, while misses retain standing effort.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation`, `samplePhysicalTrackingTarget` on in-memory inputs and asserts the returned observations through 5x TestValidator.predicate, 8x TestValidator.equals; 4 numbered scenarios (first: An incoming sphere physically contacts a tracked sphere and releases it.; last: Protective joint effort is selected after contact, while misses retain standing effort.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (12 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: An incoming sphere physically contacts a tracked sphere and releases it.; last: Protective joint effort is selected after contact, while misses retain standing effort.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_contact_release`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An incoming sphere physically contacts a tracked sphere and releases it.).
 */
export async function test_physical_contact_release(): Promise<void> {
  const striker: Simulation.IBody = PhysicalFixtures.body(
    "striker",
    PhysicalFixtures.sphere(),
    1,
    { position: { x: -0.8, y: 1, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
  );
  const receiver: Simulation.IBody = PhysicalFixtures.body(
    "receiver",
    PhysicalFixtures.sphere(),
    1,
  );
  Object.assign(receiver, {
    rootStiffness: 100,
    rootDamping: 15,
    maximumRootForce: 25,
    releaseOnContact: {
      earliest: 0.1,
      latest: 0.6,
      shapes: ["surface"],
      otherBody: "striker",
      otherShapes: ["surface"],
    },
  });
  for (const target of receiver.targets) target.strength = 1;
  const input: Simulation.IInput = PhysicalFixtures.input(
    [striker, receiver],
    1,
  );
  input.impulses.push({
    step: 1,
    body: "striker",
    bone: "root",
    point: { x: -0.8, y: 1, z: 0 },
    impulse: { x: 2, y: 0, z: 0 },
  });
  const baseline: Simulation = await Simulation.compute(input);
  const contact: Receipt | undefined = baseline.cache.contacts.find(
    (receipt: Receipt): boolean =>
      receipt.a.body !== "floor" &&
      receipt.b.body !== "floor" &&
      (receipt.impulse ?? 0) > 0,
  );
  TestValidator.predicate(
    "release follows an actual qualifying collision",
    !!contact &&
      baseline.cache.controllerCheckpoints
        .get(60)!
        .contactReleased?.includes("receiver") === true &&
      baseline.cache.at(1).bodies.receiver!.root!.position.x > 0.1,
  );
  const miss: Simulation.IInput = structuredClone(input);
  for (const target of miss.bodies[0]!.targets)
    target.segments.root!.position.y = 2;
  const missed: Simulation = await Simulation.compute(miss);
  TestValidator.predicate(
    "no contact means no withdrawal",
    missed.cache.controllerCheckpoints.get(60)!.contactReleased?.length === 0 &&
      Math.abs(missed.cache.at(1).bodies.receiver!.root!.position.x) < 1e-10,
  );
  const edited: Simulation.IInput = structuredClone(input);
  edited.impulses.push({
    step: 90,
    body: "receiver",
    bone: "root",
    point: { x: 0, y: 1, z: 0 },
    impulse: { x: 0.1, y: 0, z: 0 },
  });
  const fresh: Simulation = await Simulation.compute(edited);
  const resumed: Simulation = await Simulation.compute(edited, baseline);
  TestValidator.predicate(
    "released contact transition and native warm start resume exactly",
    resumed.recomputedSteps === 60 &&
      JSON.stringify(fresh.cache.frames) ===
        JSON.stringify(resumed.cache.frames),
  );

  const episode: Receipt = {
    ...contact!,
    seconds: 0.1,
    endSeconds: 0.5,
    impulse: 2,
    samples: [0.1, 0.5].map(
      (seconds: number): NonNullable<Receipt["samples"]>[number] => ({
        seconds,
        duration: 1 / 120,
        impulse: seconds === 0.5 ? 2 : 0,
        separation: -0.001,
        compression: 0,
        point: { x: 0, y: 1, z: 0 },
        normal: { x: 1, y: 0, z: 0 },
      }),
    ),
  };
  const state: Set<string> = new Set();
  TestValidator.equals(
    "geometric evidence never triggers physical withdrawal",
    samplePhysicalTrackingTarget(
      receiver,
      receiver.targets[0]!,
      [{ ...episode, source: "geometric", impulse: null, samples: undefined }],
      0.5,
      new Set(),
    ).strength,
    1,
  );
  TestValidator.equals(
    "out-of-window impulses do not trigger withdrawal",
    samplePhysicalTrackingTarget(
      receiver,
      receiver.targets[0]!,
      [{ ...episode, seconds: 0.7, endSeconds: 0.7, samples: undefined }],
      0.9,
      new Set(),
    ).strength,
    1,
  );
  TestValidator.equals(
    "future sample cannot release an earlier body",
    samplePhysicalTrackingTarget(
      receiver,
      receiver.targets[0]!,
      [episode],
      0.2,
      state,
    ).strength,
    1,
  );
  TestValidator.equals(
    "actual in-window sample releases the body",
    samplePhysicalTrackingTarget(
      receiver,
      receiver.targets[0]!,
      [episode],
      0.5,
      state,
    ).strength,
    0,
  );
  TestValidator.equals(
    "release remains after the contact window",
    samplePhysicalTrackingTarget(receiver, receiver.targets[0]!, [], 0.9, state)
      .strength,
    0,
  );
  const articulated: Simulation.IBody = PhysicalFixtures.body(
    "receiver",
    PhysicalModelFixtures.stickman().profile,
    1,
  );
  const joint: string = articulated.profile.joints[0]!.id;
  const segment: Simulation.IBody["profile"]["segments"][number] =
    articulated.profile.segments[0]!;
  articulated.releaseOnContact = {
    ...receiver.releaseOnContact!,
    shapes: [segment.shapes[0]!.id],
  };
  const intent: Simulation.ITarget = {
    ...articulated.targets[0]!,
    strength: 1,
    jointStrength: { [joint]: 1 },
    releasedJointStrength: { [joint]: 0.2 },
  };
  const matched: Receipt = {
    ...episode,
    a: {
      body: "receiver",
      bone: segment.bone,
      shape: segment.shapes[0]!.id,
      material: segment.shapes[0]!.material,
    },
    b: { body: "striker", bone: "root", shape: "surface", material: "solid" },
  };
  TestValidator.equals(
    "a miss keeps the original joint effort",
    samplePhysicalTrackingTarget(articulated, intent, [], 0.9, new Set())
      .jointStrength![joint],
    1,
  );
  TestValidator.equals(
    "actual contact selects protective joint effort",
    samplePhysicalTrackingTarget(articulated, intent, [matched], 0.5, new Set())
      .jointStrength![joint],
    0.2,
  );
  const invalid: Simulation.IInput = structuredClone(input);
  invalid.bodies[1]!.releaseOnContact!.otherShapes = ["missing"];
  let refused: boolean = false;
  try {
    Simulation.identity(invalid);
  } catch (error: unknown) {
    refused = String(error).includes("contact-triggered release");
  }
  TestValidator.predicate(
    "unknown selector refuses before solver allocation",
    refused,
  );
  await transferredSoftRelease();
}

/** Computed soft pressure cannot withdraw tracking unless a positive native response reached that receiver. */
async function transferredSoftRelease(): Promise<void> {
  for (const gain of [1, 1e-300]) {
    const receiver: Simulation.IBody = PhysicalFixtures.body(
      "soft-receiver",
      PhysicalFixtures.sphere(0.1, 0.1),
      2 / 120,
    );
    receiver.mode = {
      kind: "exaggerated",
      gravity: 1,
      compliance: 1,
      impulse: gain,
      reason:
        "Contact withdrawal follows actual transferred response, including native rounding",
    };
    for (const target of receiver.targets) target.strength = 1;
    receiver.releaseOnContact = {
      earliest: 0,
      latest: 2 / 120,
      shapes: ["surface"],
      otherBody: "boundary",
      otherShapes: ["surface"],
    };
    const boundary: Simulation.IBody = PhysicalFixtures.body(
      "boundary",
      PhysicalFixtures.sphere(),
      2 / 120,
    );
    boundary.mode = { kind: "kinematic" };
    for (const target of boundary.targets)
      target.segments.root!.position.x = 0.18;
    const input: Simulation.IInput = PhysicalFixtures.input(
      [receiver, boundary],
      2 / 120,
    );
    input.substeps = 8;
    input.checkpointEvery = 1;
    const run: Simulation = await Simulation.compute(input);
    TestValidator.predicate(
      "both cases contain actual computed compliant pressure",
      run.cache.contacts.some((receipt: Receipt): boolean =>
        receipt.samples!.some(
          (sample: NonNullable<Receipt["samples"]>[number]): boolean =>
            sample.impulse > 0,
        ),
      ),
    );
    TestValidator.equals(
      "only transferred positive contact withdraws tracking",
      run.cache.controllerCheckpoints
        .get(2)!
        .contactReleased!.includes(receiver.id),
      gain === 1,
    );
  }
}
