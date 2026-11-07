import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalPerformanceFixtures } from "../internal/PhysicalPerformanceFixtures";

/** A support-feedback plan rebuilt from a restored world retains the exact fresh native result. */
export async function test_physical_support_checkpoint(): Promise<void> {
  const produced: ReturnType<typeof PhysicalPerformanceFixtures.walk> =
    PhysicalPerformanceFixtures.walk(
      PhysicalModelFixtures.stickman().profile,
      1,
    );
  const input: Simulation.IInput = PhysicalFixtures.input([produced.body], 1);
  const baseline: Simulation = await Simulation.compute(input);
  const edited: Simulation.IInput = structuredClone(input);
  edited.impulses.push({
    step: 90,
    body: produced.body.id,
    bone: "hips",
    point: { x: 0, y: 1, z: 0 },
    impulse: { x: 0.2, y: 0, z: 0 },
  });
  const fresh: Simulation = await Simulation.compute(edited);
  const resumed: Simulation = await Simulation.compute(edited, baseline);
  const findings: string[] = [];
  if (resumed.recomputedSteps !== 60)
    findings.push(`recomputed ${resumed.recomputedSteps} steps`);
  if (
    JSON.stringify(fresh.cache.frames) !== JSON.stringify(resumed.cache.frames)
  )
    findings.push("fresh/resumed support states differ");
  if (
    JSON.stringify(fresh.cache.contacts) !==
    JSON.stringify(resumed.cache.contacts)
  )
    findings.push("fresh/resumed contacts differ");
  TestValidator.equals(
    "exact resumed support-feedback performance",
    findings,
    [],
  );
}
