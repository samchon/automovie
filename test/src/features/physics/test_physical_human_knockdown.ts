import { TestValidator } from "@nestia/e2e";

import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicsCache } from "../../../../packages/engine/src/physics/AutoMoviePhysicsCache";
import { preparePhysicalGeometry } from "../../../../packages/engine/src/physics/preparePhysicalGeometry";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalHumanFixtures } from "../internal/PhysicalHumanFixtures";
import { PhysicalPerformanceFixtures as Performance } from "../internal/PhysicalPerformanceFixtures";

/** A tracked actual Human receives head momentum and goes limp; native gravity, floor contacts and joints determine its complete fall and rest. */
export async function test_physical_human_knockdown(): Promise<void> {
  const person: ReturnType<typeof PhysicalHumanFixtures.get> =
    PhysicalHumanFixtures.get();
  const duration: number = 8;
  const body: Simulation.IBody = Performance.trackedBody(
    person.profile,
    duration,
  );
  body.releasedQuality = { iterations: 64, internalIterations: 64 };
  for (const [step, target] of body.targets.entries())
    target.strength = step / 120 >= 2.5 ? 0 : 1;
  const input: Simulation.IInput = PhysicalFixtures.input([body], duration);
  Object.assign(input, {
    floor: 0,
    gravity: { x: 0, y: -9.81, z: 0 },
    substeps: 32,
    iterations: 12,
    internalIterations: 1,
  });
  input.impulses.push({
    step: 120,
    body: body.id,
    bone: "head",
    point: { ...body.targets[120]!.segments.head!.position },
    impulse: { x: 10, y: 0, z: 0 },
  });
  const run: Simulation = await Simulation.compute(input);
  const geometry: Awaited<ReturnType<typeof preparePhysicalGeometry>> =
    await preparePhysicalGeometry();
  let penetration: number = 0;
  for (const frame of run.cache.frames)
    for (const segment of person.profile.segments)
      for (const shape of segment.shapes)
        penetration = Math.max(
          penetration,
          -geometry.minimumY({
            body: body.id,
            bone: segment.bone,
            shape,
            pose: frame.bodies[body.id]![segment.bone]!,
          }),
        );
  const final: (typeof run.cache.frames)[number]["bodies"][string] =
    run.cache.at(duration).bodies[body.id]!;
  const speed: number = Math.max(
    ...Object.values(final).map(
      (state: AutoMoviePhysicsCache.ISegment): number =>
        Vector3.length(state.velocity),
    ),
  );
  const observations: {
    penetration: number;
    speed: number;
    initialHeight: number;
    finalHeight: number;
    floorContacts: number;
  } = {
    penetration,
    speed,
    initialHeight: run.cache.at(0).bodies[body.id]!.hips!.position.y,
    finalHeight: final.hips!.position.y,
    floorContacts: run.cache.contacts.filter(
      (receipt: (typeof run.cache.contacts)[number]): boolean =>
        receipt.a.body === "floor" || receipt.b.body === "floor",
    ).length,
  };
  TestValidator.equals(
    `physical fall and rest ${JSON.stringify(observations)}`,
    penetration <= 0.005 &&
      speed < 0.1 &&
      observations.finalHeight < observations.initialHeight * 0.6 &&
      observations.floorContacts > 0,
    true,
  );
}
