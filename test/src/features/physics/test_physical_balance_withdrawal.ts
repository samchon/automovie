import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Sixty native steps of an unsupported fall. */
const DURATION: number = 0.5;

/** Steps between retained native checkpoints. */
const CHECKPOINT: number = 10;

/** First step of the late pose edit, after recovery has been withdrawn. */
const EDIT: number = 50;

/** Exhausted support recovery releases default pose tracking while explicit joint protection remains possible.
 *
 * Scenarios:
 * 1. An unsupported four-support primitive falls and withdraws recovery; a later pose edit leaves its physical frames unchanged.
 * 2. Fresh and checkpoint-resumed native results agree.
 * 3. Explicit protective joint effort still changes the actual articulation.
 */
export async function test_physical_balance_withdrawal(): Promise<void> {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const joint: P.IJoint = profile.joints.find(
    (candidate: P.IJoint): boolean => candidate.child === "upper-0",
  )!;
  const body: Simulation.IBody = PhysicalSupportFixtures.body(
    profile,
    DURATION,
  );
  for (const target of body.targets)
    for (const pose of Object.values(target.segments)) pose.position.y += 2;
  const input: Simulation.IInput = PhysicalFixtures.input([body], DURATION);
  input.checkpointEvery = CHECKPOINT;
  input.gravity.y = -9.81;
  input.floor = -10;
  input.substeps = 4;
  input.iterations = 16;
  const baseline: Simulation = await Simulation.compute(input);
  const changed: Simulation.IInput = structuredClone(input);
  for (const target of changed.bodies[0]!.targets.slice(EDIT))
    target.segments[joint.child]!.rotation = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      40,
    );
  const fresh: Simulation = await Simulation.compute(changed);
  const resumed: Simulation = await Simulation.compute(changed, baseline);
  TestValidator.equals(
    "a pose edit after complete recovery withdrawal has no physical effect",
    JSON.stringify(fresh.cache.frames),
    JSON.stringify(baseline.cache.frames),
  );
  TestValidator.equals(
    "restored passive articulation retains native frame identity",
    JSON.stringify(resumed.cache.frames),
    JSON.stringify(fresh.cache.frames),
  );
  TestValidator.predicate(
    "unsupported body actually falls",
    fresh.cache.at(DURATION).bodies[body.id]!.body!.position.y <
      fresh.cache.at(DURATION / 2).bodies[body.id]!.body!.position.y - 0.1,
  );

  const protectedInput: Simulation.IInput = structuredClone(changed);
  for (const target of protectedInput.bodies[0]!.targets)
    target.jointStrength = { [joint.id]: 1 };
  const protectedRun: Simulation = await Simulation.compute(protectedInput);
  TestValidator.predicate(
    "explicit protective effort still changes the actual articulation",
    JSON.stringify(
      protectedRun.cache.at(DURATION).bodies[body.id]![joint.child]!.rotation,
    ) !==
      JSON.stringify(
        fresh.cache.at(DURATION).bodies[body.id]![joint.child]!.rotation,
      ),
  );
}
