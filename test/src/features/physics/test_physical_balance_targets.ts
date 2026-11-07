import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { physicalShapeBounds } from "../../../../packages/engine/src/physics/physicalShapeBounds";
import { physicalSupportPoint } from "../../../../packages/engine/src/physics/physicalSupportPoint";
import { planPhysicalBalanceTargets } from "../../../../packages/engine/src/physics/planPhysicalBalanceTargets";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { createPhysicalBalanceInput } from "../internal/createPhysicalBalanceInput";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/** Balance joint goals use the actual floating base and complete floor patches.
 *
 * Scenarios:
 * 1. A translated/lowered arbitrary four-support root retains its measured pose while original horizontal endpoint and actual patch-plane promises remain satisfied.
 * 2. A late real impulse resumes from an actual controller/native checkpoint and exactly matches cold integration, contacts, recovery and wrench diagnostics.
 */
export async function test_physical_balance_targets(): Promise<void> {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const policy: NonNullable<Simulation.IBody["balance"]> =
    PhysicalSupportFixtures.body(profile, 1).balance!;
  const targets: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map((segment: P.ISegment): [string, P.ITransform] => [
      segment.bone,
      structuredClone(segment.neutral),
    ]),
  );
  const actual: P.ITransform = structuredClone(targets.body!);
  actual.position.x += 0.02;
  actual.position.y -= 0.015;
  const goals: Record<string, V> = Object.fromEntries(
    policy.pattern.limbs.map(
      (limb: (typeof policy.pattern.limbs)[number]): [string, V] => [
        limb.bone,
        physicalSupportPoint(targets[limb.bone]!, limb.localPoint),
      ],
    ),
  );
  const before: string = JSON.stringify({ targets, actual, goals });
  const result: ReturnType<typeof planPhysicalBalanceTargets> =
    planPhysicalBalanceTargets({
      profile,
      pattern: policy.pattern,
      targets,
      root: { bone: "body", pose: actual },
      goals,
      planted: policy.pattern.limbs.map(
        (limb: (typeof policy.pattern.limbs)[number]): string => limb.bone,
      ),
      floor: 0,
      maximumRootDrop: 0.15,
      iterations: 32,
      tolerance: 1e-5,
    });
  TestValidator.predicate(
    "balance fit preserves the measured root frame",
    vclose(result.targets.body!.position, actual.position, 1e-12) &&
      qclose(result.targets.body!.rotation, actual.rotation),
  );
  for (const limb of policy.pattern.limbs) {
    const error: V = Vector3.subtract(
      physicalSupportPoint(result.targets[limb.bone]!, limb.localPoint),
      goals[limb.bone]!,
    );
    TestValidator.predicate(
      "original support XYZ survives actual-root fitting",
      nclose(Vector3.length(error), 0, 0.001),
    );
    for (const segment of profile.segments.filter(
      (segment: P.ISegment): boolean =>
        (limb.contacts ?? [limb.bone]).includes(segment.bone),
    ))
      for (const shape of segment.shapes)
        TestValidator.predicate(
          "actual patch remains on the declared floor",
          nclose(
            physicalShapeBounds(result.targets[segment.bone]!, shape).min.y,
            0,
            0.001,
          ),
        );
  }
  assert.equal(JSON.stringify({ targets, actual, goals }), before);
  const input: Simulation.IInput = createPhysicalBalanceInput(
    profile,
    "internal",
    0,
    1.2,
  );
  input.duration = 0.3;
  input.maximumSteps = 36;
  input.checkpointEvery = 12;
  input.impulses = [];
  input.bodies[0]!.targets = input.bodies[0]!.targets.slice(0, 37);
  const baseline: Simulation = await Simulation.compute(input);
  const edited: Simulation.IInput = structuredClone(input);
  edited.impulses.push({
    step: 30,
    body: profile.id,
    bone: "body",
    point: profile.centerOfMass,
    impulse: { x: 0.001, y: 0, z: 0 },
  });
  const cold: Simulation = await Simulation.compute(edited);
  const resumed: Simulation = await Simulation.compute(edited, baseline);
  assert.equal(resumed.recomputedSteps, 12);
  for (const field of [
    "frames",
    "contacts",
    "recovery",
    "supportWrenches",
  ] as const)
    assert.equal(
      JSON.stringify(resumed.cache[field]),
      JSON.stringify(cold.cache[field]),
    );
  assert.ok(
    baseline.cache.controllerCheckpoints.get(24)!.balanceTargets?.[profile.id]
      ?.from,
  );
}
