import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Exhausted support recovery releases default pose tracking while explicit joint protection remains possible. A late pose edit cannot affect a fully released body's physical frames; fresh and resumed native results must agree. */
export async function test_physical_balance_withdrawal(): Promise<void> {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const joint: P.IJoint = profile.joints.find(
    (candidate: P.IJoint): boolean => candidate.child === "upper-0",
  )!;
  const body: Simulation.IBody = PhysicalSupportFixtures.body(profile, 1);
  for (const target of body.targets)
    for (const pose of Object.values(target.segments)) pose.position.y += 2;
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1);
  input.gravity.y = -9.81;
  input.floor = -10;
  input.substeps = 4;
  input.iterations = 16;
  const baseline: Simulation = await Simulation.compute(input);
  const changed: Simulation.IInput = structuredClone(input);
  for (const target of changed.bodies[0]!.targets.slice(90))
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
    fresh.cache.at(1).bodies[body.id]!.body!.position.y <
      fresh.cache.at(0.5).bodies[body.id]!.body!.position.y - 0.1,
  );

  const protectedInput: Simulation.IInput = structuredClone(changed);
  for (const target of protectedInput.bodies[0]!.targets)
    target.jointStrength = { [joint.id]: 1 };
  const protectedRun: Simulation = await Simulation.compute(protectedInput);
  TestValidator.predicate(
    "explicit protective effort still changes the actual articulation",
    JSON.stringify(
      protectedRun.cache.at(1).bodies[body.id]![joint.child]!.rotation,
    ) !==
      JSON.stringify(fresh.cache.at(1).bodies[body.id]![joint.child]!.rotation),
  );
}
