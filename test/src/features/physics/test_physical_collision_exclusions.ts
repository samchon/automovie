import {
  type AutoMoviePhysicsCache,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Twelve native steps. */
const DURATION: number = 0.1;

/** Declared overlapping pivot neighbours exert no spurious self-contact impulse.
 *
 * Scenarios:
 * 1. Two nonadjacent overlapping spheres on free hinges remain at zero-load rest when excluded.
 * 2. Removing only that exclusion produces an actual contact-driven displacement.
 * 3. A late external impulse resumes with the same exclusion and bit-identical frames.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Vector3`, `AutoMoviePhysicalSimulation`, `AutoMoviePhysicsCache` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate; 3 numbered scenarios (first: Two nonadjacent overlapping spheres on free hinges remain at zero-load rest when excluded.; last: A late external impulse resumes with the same exclusion and bit-identical frames.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (2 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Two nonadjacent overlapping spheres on free hinges remain at zero-load rest when excluded.; last: A late external impulse resumes with the same exclusion and bit-identical frames.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_collision_exclusions`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Two nonadjacent overlapping spheres on free hinges remain at zero-load rest when excluded.).
 */
export async function test_physical_collision_exclusions(): Promise<void> {
  const profile: P = PhysicalFixtures.sphere();
  const root: P.ISegment = profile.segments[0]!;
  const carrier: P.ISegment = structuredClone(root);
  carrier.bone = "carrier";
  carrier.neutral.position = { x: 0, y: 1.2, z: 0 };
  const tip: P.ISegment = structuredClone(root);
  tip.bone = "tip";
  tip.neutral.position = { x: 0.05, y: 1.05, z: 0 };
  profile.segments.push(carrier, tip);
  profile.mass = 3;
  profile.centerOfMass = { x: 0.05 / 3, y: 3.25 / 3, z: 0 };
  profile.joints = [carrier, tip].map(
    (segment: P.ISegment, index: number): P.IJoint => {
      const parent: P.ISegment = index === 0 ? root : carrier;
      return {
        id: segment.bone,
        parent: parent.bone,
        child: segment.bone,
        parentFrame: {
          position: Vector3.subtract(
            segment.neutral.position,
            parent.neutral.position,
          ),
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        childFrame: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        axes: [
          {
            axis: "z",
            minimum: -Math.PI,
            maximum: Math.PI,
            stiffness: 0,
            damping: 0,
            maximumTorque: 1,
            channel: "hinge",
          },
        ],
      };
    },
  );
  profile.collisionExclusions = [
    {
      a: "root",
      b: "tip",
      reason: "Fixture's intentionally overlapping pivot solids.",
    },
  ];
  // Twelve steps: an admitted overlap separates within a few steps, and a
  // checkpoint every four steps gives the late impulse a restored world.
  const input: Simulation.IInput = PhysicalFixtures.input(
    [PhysicalFixtures.body("rig", profile, DURATION)],
    DURATION,
  );
  input.checkpointEvery = 4;
  const excluded: Simulation = await Simulation.compute(input);
  const includedInput: Simulation.IInput = structuredClone(input);
  includedInput.bodies[0]!.profile.collisionExclusions = [];
  const included: Simulation = await Simulation.compute(includedInput);
  const drift: (run: Simulation) => number = (run: Simulation): number =>
    Vector3.length(
      Vector3.subtract(
        run.cache.at(DURATION).bodies.rig!.tip!.position,
        tip.neutral.position,
      ),
    );
  TestValidator.predicate(
    "excluded overlaps preserve zero-load rest",
    drift(excluded) < 0.0001,
  );
  TestValidator.predicate(
    "admitted overlap delivers a physical displacement",
    drift(included) > 0.005,
  );
  const edited: Simulation.IInput = structuredClone(input);
  edited.impulses.push({
    step: 9,
    body: "rig",
    bone: "tip",
    point: tip.neutral.position,
    impulse: { x: 0.1, y: 0, z: 0 },
  });
  const resumed: Simulation = await Simulation.compute(edited, excluded);
  const fresh: Simulation = await Simulation.compute(edited);
  const firstDifference: number = resumed.cache.frames.findIndex(
    (frame: AutoMoviePhysicsCache.IFrame, index: number): boolean =>
      JSON.stringify(frame) !== JSON.stringify(fresh.cache.frames[index]),
  );
  TestValidator.predicate(
    `restored exclusions preserve exact dynamics; first divergent frame ${firstDifference}`,
    firstDifference === -1,
  );
}
