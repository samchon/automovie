import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Seventy-two native steps: support loss is withdrawn within the first half second. */
const DURATION: number = 0.6;

/** Steps between retained native checkpoints. */
const CHECKPOINT: number = 20;

/** Checkpoint whose restored world must carry the released quality. */
const QUALITY: number = 60;

/** First edited step, after that checkpoint. */
const EDIT: number = 65;

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
    DURATION,
  );
  body.releasedQuality = {
    iterations: 20,
    internalIterations: 8,
    duringReflex: true,
  };
  for (const target of body.targets)
    for (const pose of Object.values(target.segments)) pose.position.y += 0.5;
  const input: Simulation.IInput = PhysicalFixtures.input([body], DURATION);
  input.gravity.y = -9.81;
  input.checkpointEvery = CHECKPOINT;
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
      body.targets[QUALITY]!.strength === 1,
  );
  const world: World = RAPIER.World.restoreSnapshot(
    baseline.cache.checkpoints.get(QUALITY)!,
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
    step: EDIT,
    body: body.id,
    bone: "body",
    point: { x: 0, y: 1, z: 0 },
    impulse: { x: 0.1, y: 0, z: 0 },
  });
  const fresh: Simulation = await Simulation.compute(edited);
  const resumed: Simulation = await Simulation.compute(edited, baseline);
  if (
    resumed.recomputedSteps !==
      input.maximumSteps - Math.floor(EDIT / CHECKPOINT) * CHECKPOINT ||
    JSON.stringify(fresh.cache.frames) !== JSON.stringify(resumed.cache.frames)
  )
    findings.push("effective-release checkpoint continuation");
  TestValidator.equals("native budget and exact continuation", findings, []);
}
