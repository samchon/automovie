import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Effective balance withdrawal selects the same quality as authored release.
 *
 * Scenarios:
 * 1. A four-support primitive starts unsupported with authored tracking active.
 * 2. Actual support loss withdraws root control and selects the declared budget.
 * 3. A late impulse resumes that released controller and native warm start exactly.
 */
export async function test_physical_balance_release_quality(): Promise<void> {
  const body: Simulation.IBody = PhysicalSupportFixtures.body(
    PhysicalModelFixtures.quadrupod(),
    1,
  );
  body.releasedQuality = {
    iterations: 20,
    internalIterations: 8,
    duringReflex: true,
  };
  for (const target of body.targets)
    for (const pose of Object.values(target.segments)) pose.position.y += 0.5;
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1);
  input.gravity.y = -9.81;
  const baseline: Simulation = await Simulation.compute(input);
  TestValidator.predicate(
    "canonical distant floor cannot restore support during the withdrawal fixture",
    baseline.cache.contacts.every(
      (receipt: (typeof baseline.cache.contacts)[number]): boolean =>
        receipt.a.body !== "floor" && receipt.b.body !== "floor",
    ),
  );
  TestValidator.predicate(
    "balance release is observed while authored control remains active",
    baseline.cache.recovery[body.id]!.lostSince !== undefined &&
      body.targets[60]!.strength === 1,
  );
  const world: World = RAPIER.World.restoreSnapshot(
    baseline.cache.checkpoints.get(60)!,
  );
  const findings: string[] = [];
  try {
    world.bodies.forEach((rigid: RigidBody): void => {
      if (
        rigid.isDynamic() &&
        (rigid.additionalSolverIterations() !== 8 ||
          rigid.additionalPgsIterations() !== 7)
      )
        findings.push("missing effective-release quality");
    });
  } finally {
    world.free();
  }
  const edited: Simulation.IInput = structuredClone(input);
  edited.impulses.push({
    step: 90,
    body: body.id,
    bone: "body",
    point: { x: 0, y: 1, z: 0 },
    impulse: { x: 0.1, y: 0, z: 0 },
  });
  const fresh: Simulation = await Simulation.compute(edited);
  const resumed: Simulation = await Simulation.compute(edited, baseline);
  if (
    resumed.recomputedSteps !== 60 ||
    JSON.stringify(fresh.cache.frames) !== JSON.stringify(resumed.cache.frames)
  )
    findings.push("effective-release checkpoint continuation");
  TestValidator.equals("native budget and exact continuation", findings, []);
}
