import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import RAPIER, { type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { bindPhysicalWorld } from "../../../../packages/engine/src/physics/bindPhysicalWorld";
import { preparePhysicalGeometry as Geometry } from "../../../../packages/engine/src/physics/preparePhysicalGeometry";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** The declared contact law reaches the real immobile floor under independent high load.
 *
 * Scenarios:
 * 1. An analytic0.6kg pad under40kg-equivalent gravity distinguishes60/240Hz.
 * 2. Native floor impulses carry the declared load and the240Hz surface stays within1mm.
 * 3. Every checkpoint preserves all six floor coordinates and zero velocities.
 * 4. Checkpoint continuation remains identical after a late target-only edit.
 */
export async function test_physical_floor_frequency(): Promise<void> {
  const mass: number = 0.6;
  const extent: P.ITransform["position"] = { x: 0.08, y: 0.04, z: 0.05 };
  const profile: P = PhysicalFixtures.sphere();
  profile.id = "analytic-loaded-pad";
  profile.mass = mass;
  profile.centerOfMass.y = extent.y;
  profile.provenance =
    "Uniform0.6kg box with analytic solid inertia; explicit gravitational acceleration supplies392.4N without injected impulses.";
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
  const geometry: Geometry.IQueries = await Geometry();
  const observations: {
    frequency: number;
    minimum: number;
    creep: number;
    force: number;
    run: Simulation;
  }[] = [];
  const findings: string[] = [];
  for (const frequency of [60, 240]) {
    const body: Simulation.IBody = PhysicalFixtures.body("pad", profile, 2);
    // Zero-budget tracking adds no force and does not wake a sleeping contact.
    // Measure solved load in the settled awake window, then retain sleep as a
    // distinct native state rather than synthesizing a static impulse stream.
    for (const target of body.targets) target.strength = 1;
    const input: Simulation.IInput = PhysicalFixtures.input([body], 2);
    Object.assign(input, {
      floor: 0,
      gravity: { x: 0, y: (-40 * 9.81) / mass, z: 0 },
      contactFrequency: frequency,
      substeps: 32,
      iterations: 64,
      internalIterations: 4,
    });
    const run: Simulation = await Simulation.compute(input);
    const heights: number[] = run.cache.frames
      .filter(
        (frame: (typeof run.cache.frames)[number]): boolean =>
          frame.seconds >= 1,
      )
      .map((frame: (typeof run.cache.frames)[number]): number =>
        geometry.minimumY({
          body: "pad",
          bone: "root",
          shape: segment.shapes[0]!,
          pose: frame.bodies.pad!.root!,
        }),
      );
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
          ): boolean => sample.seconds > 0.25 && sample.seconds <= 0.5,
        )
        .reduce(
          (
            sum: number,
            sample: NonNullable<
              (typeof run.cache.contacts)[number]["samples"]
            >[number],
          ): number => sum + sample.impulse,
          0,
        ) / 0.25;
    const minimum: number = Math.min(...heights);
    const creep: number = Math.max(...heights) - minimum;
    observations.push({ frequency, minimum, creep, force, run });
    if (Math.abs(force - 40 * 9.81) > 0.1 * 40 * 9.81)
      findings.push(`${frequency}: native solved load ${force}`);
    const sleeping: Uint8Array | undefined = run.cache.checkpoints.get(120);
    if (!sleeping) findings.push(`${frequency}: missing sleep checkpoint`);
    else {
      const world: World = RAPIER.World.restoreSnapshot(sleeping);
      try {
        const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
          world,
          run.input,
          true,
        );
        if (!bound.segments.get("pad")!.get("root")!.isSleeping())
          findings.push(
            `${frequency}: unloaded actuator unexpectedly woke resting pad`,
          );
      } finally {
        world.free();
      }
    }
    if (
      run.cache.contacts.some(
        (receipt: (typeof run.cache.contacts)[number]): boolean =>
          receipt.source === "solver" &&
          (receipt.samples ?? []).some(
            (sample: NonNullable<typeof receipt.samples>[number]): boolean =>
              sample.seconds > 1 && sample.impulse > 0,
          ),
      )
    )
      findings.push(
        `${frequency}: sleeping fixture unexpectedly reports new impulses`,
      );
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
          findings.push(`${frequency}: floor moved in a native checkpoint`);
      } finally {
        world.free();
      }
    }
  }
  const soft: (typeof observations)[number] = observations[0]!;
  const firm: (typeof observations)[number] = observations[1]!;
  if (
    !(soft.minimum < -0.001 && firm.minimum >= -0.001 && firm.creep <= 0.0002)
  )
    findings.push(
      `load/clearance: ${JSON.stringify(observations.map((row: (typeof observations)[number]): object => ({ frequency: row.frequency, minimum: row.minimum, creep: row.creep, force: row.force })))}`,
    );
  const edited: Simulation.IInput = structuredClone(firm.run.input);
  edited.bodies[0]!.targets[220]!.segments.root!.position.x += 0.001;
  const resumed: Simulation = await Simulation.compute(edited, firm.run);
  const cold: Simulation = await Simulation.compute(edited);
  if (
    !(resumed.recomputedSteps > 0 && resumed.recomputedSteps < 240) ||
    JSON.stringify(resumed.cache.frames) !==
      JSON.stringify(cold.cache.frames) ||
    JSON.stringify(resumed.cache.contacts) !==
      JSON.stringify(cold.cache.contacts)
  )
    findings.push(
      "immobile-floor checkpoint continuation differs from cold native integration",
    );
  TestValidator.equals(
    "all actual floor law, load and checkpoint observations",
    findings,
    [],
  );
}
