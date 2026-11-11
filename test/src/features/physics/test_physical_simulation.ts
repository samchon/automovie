import {
  AutoMoviePhysicalSimulation as Simulation,
  validatePhysicalProfile,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Fixed-step dynamics, replay order and late-edit restart retain the same state.
 *
 * Scenarios:
 * 1. A one-kilogram sphere drops one metre and settles on a real plane.
 * 2. Independent runs and arbitrary cache-read order have bit-identical states.
 * 3. An impulse at step 200 resumes at checkpoint 180 and preserves the prefix.
 * 4. A kinematic body follows its authored positions without executing dynamics.
 * 5. Invalid masses, inertia, references and totals yield field-specific defects.
 *
 * These portable CPU cases assert the simulation output, not a recorded result
 * or an implementation arrangement. The resting height comes from the sphere
 * radius; 2 mm permits the native solver's default contact slop. Exact JSON
 * comparisons intentionally check the requested bit identity, not approximate
 * physical equality. Render and cross-machine results need separate observation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation`, `validatePhysicalProfile` on in-memory inputs and asserts the returned observations through 3x TestValidator.equals, 10x TestValidator.predicate; 5 numbered scenarios (first: A one-kilogram sphere drops one metre and settles on a real plane.; last: Invalid masses, inertia, references and totals yield field-specific defects.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (8 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: A one-kilogram sphere drops one metre and settles on a real plane.; last: Invalid masses, inertia, references and totals yield field-specific defects.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_simulation`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A one-kilogram sphere drops one metre and settles on a real plane.).
 */
export async function test_physical_simulation(): Promise<void> {
  const input: Simulation.IInput = falling();
  const progress: number[] = [];
  const first: Simulation = await Simulation.compute(
    input,
    undefined,
    undefined,
    (completed: number, total: number): void => {
      TestValidator.equals(
        "progress retains its declared finite work bound",
        total,
        240,
      );
      progress.push(completed);
    },
  );
  const second: Simulation = await Simulation.compute(input);
  TestValidator.equals(
    "independent current-input admission identifies the actual completed cache",
    Simulation.identity(input),
    first.cache.identity,
  );
  TestValidator.predicate(
    "progress observes complete work monotonically without changing the physical result",
    (): boolean =>
      progress[0] === 0 &&
      progress.at(-1) === 240 &&
      progress.every(
        (completed: number, index: number): boolean =>
          index === 0 || completed > progress[index - 1]!,
      ),
  );
  TestValidator.predicate(
    "independent cached states are bit identical",
    (): boolean =>
      JSON.stringify(first.cache.frames) ===
      JSON.stringify(second.cache.frames),
  );
  const finalY: number = first.cache.at(2).bodies.ball!.root!.position.y;
  TestValidator.predicate(
    "falls and rests on the sphere surface",
    (): boolean => Math.abs(finalY - 0.1) < 0.002,
  );
  TestValidator.predicate(
    "solver gives real floor contact impulse",
    (): boolean =>
      first.cache.contacts.some(
        (receipt: (typeof first.cache.contacts)[number]): boolean =>
          receipt.source === "solver" &&
          (receipt.impulse ?? 0) > 0 &&
          receipt.separation <= 0,
      ),
  );
  for (const seconds of [1.75, 0, 1.1, 2, 0.25]) first.cache.at(seconds);
  TestValidator.predicate(
    "random-order reads do not alter physics",
    (): boolean =>
      JSON.stringify(first.cache.frames) ===
      JSON.stringify(second.cache.frames),
  );
  const edited: Simulation.IInput = structuredClone(input);
  edited.impulses.push({
    step: 200,
    body: "ball",
    bone: "root",
    impulse: { x: 1, y: 0, z: 0 },
    point: { x: 0, y: 0.1, z: 0 },
  });
  const resumed: Simulation = await Simulation.compute(edited, first);
  const fresh: Simulation = await Simulation.compute(edited);
  TestValidator.predicate(
    "late edit uses the nearest earlier checkpoint",
    (): boolean => resumed.recomputedSteps === 60,
  );
  TestValidator.predicate(
    "restart state equals an independent complete run",
    (): boolean =>
      JSON.stringify(resumed.cache.frames) ===
      JSON.stringify(fresh.cache.frames),
  );
  TestValidator.equals(
    "contact history resumes without future samples or lost accumulated impulse",
    JSON.stringify(resumed.cache.contacts),
    JSON.stringify(fresh.cache.contacts),
  );
  TestValidator.predicate(
    "unchanged prefix retained",
    (): boolean =>
      JSON.stringify(first.cache.frames.slice(0, 181)) ===
      JSON.stringify(resumed.cache.frames.slice(0, 181)),
  );
  const kinematic: Simulation.IInput = falling();
  kinematic.bodies[0]!.mode = { kind: "kinematic" };
  const authored: Simulation = await Simulation.compute(kinematic);
  TestValidator.predicate(
    "kinematic path stays authored",
    (): boolean =>
      authored.recomputedSteps === 0 &&
      authored.cache.at(2).bodies.ball!.root!.position.y === 1 &&
      authored.cache.contacts.length === 0,
  );
  const malformed: P = structuredClone(input.bodies[0]!.profile);
  malformed.segments[0]!.mass = -1;
  malformed.segments[0]!.inertia.x = -1;
  malformed.segments[0]!.shapes[0]!.material = "missing";
  const errors: string[] = validatePhysicalProfile(malformed);
  TestValidator.predicate(
    "all independent admission causes are reported",
    (): boolean =>
      errors.includes("segments[0].mass") &&
      errors.includes("segments[0].inertia") &&
      errors.includes("segments[0].shapes[0].material") &&
      errors.includes("mass: segment sum"),
  );
}

/** Analytic one-sphere fixture, with no film, species or fitted expected state. */
function falling(): Simulation.IInput {
  const profile: P = {
    id: "ball",
    mass: 1,
    centerOfMass: { x: 0, y: 0, z: 0 },
    provenance: "One kilogram, solid sphere radius 0.1 m: inertia 2mr²/5.",
    segments: [
      {
        bone: "root",
        neutral: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
        },
        mass: 1,
        centerOfMass: { x: 0, y: 0, z: 0 },
        inertia: { x: 0.004, y: 0.004, z: 0.004 },
        inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
        shapes: [
          {
            id: "sphere",
            kind: "sphere",
            radius: 0.1,
            material: "solid",
            transform: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
            },
          },
        ],
      },
    ],
    joints: [],
    materials: [
      { id: "solid", friction: 0.5, restitution: 0, compliance: 0, damping: 0 },
    ],
  };
  return {
    duration: 2,
    rate: 120,
    gravity: { x: 0, y: -9.81, z: 0 },
    floor: 0,
    floorBounds: {
      min: { x: -20, z: -20 },
      max: { x: 20, z: 20 },
      thickness: 1,
    },
    bodies: [
      {
        id: "ball",
        profile,
        mode: { kind: "simulated" },
        targets: Array.from(
          { length: 241 },
          (): Simulation.ITarget => ({
            strength: 0,
            segments: {
              root: {
                position: { x: 0, y: 1, z: 0 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
              },
            },
          }),
        ),
        rootStiffness: 0,
        rootDamping: 0,
        maximumRootForce: 0,
        complianceSeconds: 0.1,
        complianceStrength: 0,
      },
    ],
    impulses: [],
    checkpointEvery: 60,
    yieldEvery: 120,
    iterations: 8,
    maximumSteps: 240,
    maximumSegments: 4,
  };
}
