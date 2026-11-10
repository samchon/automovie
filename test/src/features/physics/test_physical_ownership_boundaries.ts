import {
  AutoMoviePhysicalPlayback as Playback,
  AutoMoviePhysicalSimulation as Simulation,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Native authority boundaries retain rational event time and admitted constraint residuals.
 *
 * Scenarios:
 * 1. First-interval activation and exact-completion reactivation encode/decode at three native rates.
 * 2. A declared 1 mm native pivot residual returns continuously instead of projecting the entry pose.
 * 3. A returning parent can remain connected to a dynamic child across the native step.
 * 4. Admitted compliant floor compression does not falsely obstruct a stationary return.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalPlayback`, `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate, 7x TestValidator.equals; 4 numbered scenarios (first: First-interval activation and exact-completion reactivation encode/decode at three native rates.; last: Admitted compliant floor compression does not falsely obstruct a stationary return.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (9 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: First-interval activation and exact-completion reactivation encode/decode at three native rates.; last: Admitted compliant floor compression does not falsely obstruct a stationary return.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_ownership_boundaries`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: First-interval activation and exact-completion reactivation encode/decode at three native rates.).
 */
export async function test_physical_ownership_boundaries(): Promise<void> {
  for (const substeps of [3, 8, 32]) {
    const ball: Simulation.IBody = PhysicalFixtures.body(
      "clock",
      PhysicalFixtures.sphere(),
      0.6,
    );
    for (const [step, target] of ball.targets.entries()) {
      target.dynamicSegments =
        (step >= 1 && step <= 24) || step >= 49 ? ["root"] : [];
      target.segments.root!.position.x = step / 120;
    }
    const input: Simulation.IInput = PhysicalFixtures.input([ball], 0.6);
    input.substeps = substeps;
    const run: Simulation = await Simulation.compute(input);
    let previous: number = 0;
    for (const entry of run.cache.ownership) {
      TestValidator.predicate(
        "authority times stay on the nonnegative rational tick grid",
        entry.seconds >= previous &&
          entry.seconds >= 0 &&
          Math.abs(
            entry.seconds * 120 * substeps -
              Math.round(entry.seconds * 120 * substeps),
          ) < 1e-10,
      );
      previous = entry.seconds;
    }
    TestValidator.equals(
      "first-interval activation begins at zero",
      run.cache.ownershipAt(ball.id, "root", 0),
      "dynamic",
    );
    TestValidator.equals(
      "reactivation owns the exact completion boundary",
      run.cache.ownershipAt(ball.id, "root", 0.4),
      "dynamic",
    );
    const encoded: Uint8Array = await Playback.encode(run.cache, 1_000_000);
    const replay: Playback = await Playback.decode(
      encoded,
      run.cache.identity,
      { maximumBytes: 1_000_000, maximumFrames: 73, maximumSegments: 1 },
    );
    TestValidator.equals(
      "rational boundary metadata round trip",
      JSON.stringify(replay.ownership),
      JSON.stringify(run.cache.ownership),
    );
  }
  const inherited: Simulation.IBody = pair(0.4);
  inherited.handoffLimits = {
    maximumLinearError: 0.005,
    maximumJointViolation: 0.01,
  };
  inherited.targets[0]!.segments.child!.position.x += 0.001;
  for (const [step, target] of inherited.targets.entries())
    target.dynamicSegments = step === 0 ? ["root", "child"] : [];
  const inheritedInput: Simulation.IInput = PhysicalFixtures.input(
    [inherited],
    0.4,
  );
  inheritedInput.substeps = 8;
  inheritedInput.iterations = 32;
  const returned: Simulation = await Simulation.compute(inheritedInput);
  const initial: (typeof returned.cache.frames)[number]["bodies"][string][string] =
    returned.cache.at(0).bodies[inherited.id]!.child!;
  const first: typeof initial = returned.cache.at(1 / 120).bodies[inherited.id]!
    .child!;
  TestValidator.predicate(
    "entry retains admitted native error and velocity",
    Math.abs(initial.position.x - 0.301) < 1e-6 &&
      Math.abs(first.velocity.x - initial.velocity.x) < 0.03 &&
      Math.abs(first.position.x - 0.3) > 1e-6,
  );
  TestValidator.predicate(
    "inherited error converges to the fixed pivot",
    Math.abs(
      returned.cache.at(0.4).bodies[inherited.id]!.child!.position.x - 0.3,
    ) < 1e-6,
  );
  const mixed: Simulation.IBody = pair(0.4);
  mixed.handoffLimits = {
    maximumLinearError: 0.005,
    maximumJointViolation: 0.01,
  };
  for (const [step, target] of mixed.targets.entries())
    target.dynamicSegments = step <= 12 ? ["root", "child"] : ["child"];
  const mixedInput: Simulation.IInput = PhysicalFixtures.input([mixed], 0.4);
  Object.assign(mixedInput, {
    substeps: 8,
    iterations: 32,
    internalIterations: 4,
  });
  mixedInput.impulses.push({
    step: 1,
    body: mixed.id,
    bone: "root",
    point: { x: 0, y: 2, z: 0 },
    impulse: { x: 2, y: 0, z: 0 },
  });
  const attached: Simulation = await Simulation.compute(mixedInput);
  TestValidator.equals(
    "parent returns while child remains dynamic",
    attached.cache.ownershipAt(mixed.id, "root", 0.2),
    "return",
  );
  TestValidator.equals(
    "mixed child retains native authority",
    attached.cache.ownershipAt(mixed.id, "child", 0.35),
    "dynamic",
  );
  TestValidator.equals(
    "parent completes authored return",
    attached.cache.ownershipAt(mixed.id, "root", 0.4),
    "authored",
  );
  const soft: Simulation.IBody = PhysicalFixtures.body(
    "soft",
    PhysicalFixtures.sphere(0.1, 0.1),
    0.3,
  );
  for (const [step, target] of soft.targets.entries()) {
    target.dynamicSegments = step === 0 ? ["root"] : [];
    target.segments.root!.position.y = 0.08;
  }
  const softInput: Simulation.IInput = PhysicalFixtures.input([soft], 0.3);
  softInput.floor = 0;
  softInput.substeps = 8;
  const compressed: Simulation = await Simulation.compute(softInput);
  TestValidator.equals(
    "material compression remains admissible during return",
    compressed.cache.ownershipAt(soft.id, "root", 0.3),
    "authored",
  );
}

/** Equal-mass bodies have a 0.3 m horizontal separation and one limited hinge. */
function pair(duration: number): Simulation.IBody {
  const prototype: P.ISegment = PhysicalFixtures.sphere().segments[0]!;
  const root: P.ISegment = {
    ...structuredClone(prototype),
    bone: "root",
    neutral: {
      position: { x: 0, y: 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  };
  const child: P.ISegment = {
    ...structuredClone(prototype),
    bone: "child",
    neutral: {
      position: { x: 0.3, y: 2, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  };
  const profile: P = {
    id: "native-pair",
    mass: 2,
    centerOfMass: { x: 0.15, y: 2, z: 0 },
    provenance:
      "Two uniform one-kilogram spheres, each radius0.1m, joined at their midpoint.",
    segments: [root, child],
    materials: PhysicalFixtures.sphere().materials,
    joints: [
      {
        id: "hinge",
        parent: "root",
        child: "child",
        parentFrame: {
          position: { x: 0.15, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        childFrame: {
          position: { x: -0.15, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        axes: [
          {
            axis: "z",
            channel: "hinge.angle",
            minimum: -1,
            maximum: 1,
            stiffness: 10,
            damping: 1,
            maximumTorque: 20,
          },
        ],
      },
    ],
  };
  const body: Simulation.IBody = PhysicalFixtures.body(
    "pair",
    profile,
    duration,
  );
  for (const target of body.targets) target.strength = 1;
  return body;
}
