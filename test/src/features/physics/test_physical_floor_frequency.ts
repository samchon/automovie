import {
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  bindPhysicalWorld,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import RAPIER, { type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Thirty native steps: settling, then a loaded window. */
const DURATION: number = 0.25;

/** Start of the loaded window, seconds. */
const LOADED: number = 0.125;

/** Initial floor penetration of the frequency probe, metres. */
const PENETRATION: number = 0.002;

/** The declared contact law reaches the real immobile floor.
 *
 * Scenarios:
 * 1. One native step from the same 2 mm floor penetration pushes a pad out faster at 240 Hz than at 60 Hz, so the declared frequency governs the floor contact rather than a fixed body's unexposed 60 Hz law.
 * 2. Over a settled window, the floor's native impulse receipts carry the pad's weight m g within 10 %, without double-counted samples.
 * 3. Every retained checkpoint restores the floor at its declared pose with all six coordinates and zero velocities.
 *
 * Checkpoint continuation belongs to the native simulation units; the stiffness of each frequency is Rapier's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Vector3`, `AutoMoviePhysicalSimulation`, `bindPhysicalWorld` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; 3 numbered scenarios (first: One native step from the same 2 mm floor penetration pushes a pad out faster at 240 Hz than at 60 Hz, so the...; last: Every retained checkpoint restores the floor at its declared pose with all six coordinates and zero...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: One native step from the same 2 mm floor penetration pushes a pad out faster at 240 Hz than at 60 Hz, so the...; last: Every retained checkpoint restores the floor at its declared pose with all six coordinates and zero...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_floor_frequency`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: One native step from the same 2 mm floor penetration pushes a pad out faster at 240 Hz than at 60 Hz, so the declared frequency governs...).
 */
export async function test_physical_floor_frequency(): Promise<void> {
  const mass: number = 0.6;
  const extent: P.ITransform["position"] = { x: 0.08, y: 0.04, z: 0.05 };
  const profile: P = PhysicalFixtures.sphere();
  profile.id = "analytic-loaded-pad";
  profile.mass = mass;
  profile.centerOfMass.y = extent.y;
  profile.provenance = "Uniform 0.6 kg box with analytic solid inertia.";
  const segment: P.ISegment = profile.segments[0]!;
  segment.mass = mass;
  segment.neutral.position.y = extent.y;
  segment.inertia = {
    x: (mass * (extent.y ** 2 + extent.z ** 2)) / 3,
    y: (mass * (extent.x ** 2 + extent.z ** 2)) / 3,
    z: (mass * (extent.x ** 2 + extent.y ** 2)) / 3,
  };
  segment.shapes = [
    {
      id: "surface",
      material: "solid",
      kind: "box",
      halfExtents: extent,
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
  ];
  profile.materials[0]!.friction = 0.7;
  const findings: string[] = [];

  // One step out of the same penetration at both declared frequencies.
  const rise: number[] = [];
  for (const frequency of [60, 240]) {
    const body: Simulation.IBody = PhysicalFixtures.body(
      "pad",
      profile,
      1 / 120,
    );
    for (const target of body.targets)
      target.segments.root!.position.y = extent.y - PENETRATION;
    const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
    Object.assign(input, {
      floor: 0,
      contactFrequency: frequency,
      substeps: 1,
    });
    const run: Simulation = await Simulation.compute(input);
    rise.push(run.cache.at(1 / 120).bodies.pad!.root!.velocity.y);
  }
  if (!(rise[0]! > 0 && rise[1]! > rise[0]!))
    findings.push(`frequency-ordered push-out ${JSON.stringify(rise)}`);

  // The settled weight in the floor's impulse receipts.
  const body: Simulation.IBody = PhysicalFixtures.body(
    "pad",
    profile,
    DURATION,
  );
  const input: Simulation.IInput = PhysicalFixtures.input([body], DURATION);
  Object.assign(input, {
    floor: 0,
    gravity: { x: 0, y: -9.81, z: 0 },
    substeps: 4,
    checkpointEvery: 15,
  });
  const run: Simulation = await Simulation.compute(input);
  const force: number =
    run.cache.contacts
      .flatMap(
        (
          receipt: (typeof run.cache.contacts)[number],
        ): NonNullable<typeof receipt.samples> =>
          receipt.source === "solver" &&
          (receipt.a.body === "floor" || receipt.b.body === "floor")
            ? (receipt.samples ?? [])
            : [],
      )
      .filter(
        (
          sample: NonNullable<
            (typeof run.cache.contacts)[number]["samples"]
          >[number],
        ): boolean => sample.seconds > LOADED && sample.seconds <= DURATION,
      )
      .reduce(
        (
          sum: number,
          sample: NonNullable<
            (typeof run.cache.contacts)[number]["samples"]
          >[number],
        ): number => sum + sample.impulse,
        0,
      ) /
    (DURATION - LOADED);
  if (Math.abs(force - mass * 9.81) > 0.1 * mass * 9.81)
    findings.push(`native solved load ${force} N`);
  if (run.cache.checkpoints.size < 3)
    findings.push(`only ${run.cache.checkpoints.size} checkpoints`);
  for (const snapshot of run.cache.checkpoints.values()) {
    const world: World = RAPIER.World.restoreSnapshot(snapshot);
    try {
      const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
        world,
        run.input,
        true,
      );
      const floor: NonNullable<typeof bound.floor> = bound.floor!;
      const rotation: ReturnType<typeof floor.rotation> = floor.rotation();
      if (
        !floor.isKinematic() ||
        Vector3.length(
          Vector3.subtract(floor.translation(), { x: 0, y: -0.5, z: 0 }),
        ) > 1e-8 ||
        Math.hypot(rotation.x, rotation.y, rotation.z) > 1e-8 ||
        Math.abs(rotation.w - 1) > 1e-8 ||
        Vector3.length(floor.linvel()) > 1e-8 ||
        Vector3.length(floor.angvel()) > 1e-8
      )
        findings.push("floor moved in a native checkpoint");
    } finally {
      world.free();
    }
  }
  TestValidator.equals(
    "all actual floor law, load and checkpoint observations",
    findings,
    [],
  );
}
