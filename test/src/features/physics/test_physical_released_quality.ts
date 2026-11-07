import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Native per-island quality survives checkpoints and is withdrawn when authored control returns. */
export async function test_physical_released_quality(): Promise<void> {
  for (const reflex of [false, true]) {
    const body: Simulation.IBody = PhysicalFixtures.body(
      reflex ? "articulation" : "ball",
      reflex
        ? PhysicalModelFixtures.stickman().profile
        : PhysicalFixtures.sphere(),
      2,
    );
    const root: string = body.profile.segments.find(
      (segment: (typeof body.profile.segments)[number]): boolean =>
        !body.profile.joints.some(
          (joint: (typeof body.profile.joints)[number]): boolean =>
            joint.child === segment.bone,
        ),
    )!.bone;
    Object.assign(body, {
      rootStiffness: 10,
      rootDamping: 5,
      maximumRootForce: 20,
      releasedQuality: {
        iterations: 20,
        internalIterations: 8,
        ...(reflex ? { duringReflex: true } : {}),
      },
    });
    for (const [step, target] of body.targets.entries())
      target.strength = step < 120 ? 0 : 1;
    if (reflex)
      for (const target of body.targets)
        target.jointStrength = { [body.profile.joints[0]!.id]: 0.2 };
    const input: Simulation.IInput = PhysicalFixtures.input([body], 2);
    input.impulses.push({
      step: 30,
      body: body.id,
      bone: root,
      point: { x: 0, y: 1, z: 0 },
      impulse: { x: 1, y: 0, z: 0 },
    });
    const baseline: Simulation = await Simulation.compute(input);
    const findings: string[] = [];
    for (const [step, expected] of [
      [60, [8, 7]],
      [180, [0, 0]],
    ] as const) {
      const world: World = RAPIER.World.restoreSnapshot(
        baseline.cache.checkpoints.get(step)!,
      );
      try {
        world.bodies.forEach((rigid: RigidBody): void => {
          if (!rigid.isDynamic()) return;
          if (
            rigid.additionalSolverIterations() !== expected[0] ||
            rigid.additionalPgsIterations() !== expected[1]
          )
            findings.push(`native quality at step ${step}`);
        });
      } finally {
        world.free();
      }
    }
    const edited: Simulation.IInput = structuredClone(input);
    edited.impulses.push({
      step: 90,
      body: body.id,
      bone: root,
      point: { x: 0, y: 1, z: 0 },
      impulse: { x: 0.2, y: 0, z: 0 },
    });
    const fresh: Simulation = await Simulation.compute(edited);
    const resumed: Simulation = await Simulation.compute(edited, baseline);
    if (
      resumed.recomputedSteps !== 180 ||
      JSON.stringify(resumed.cache.frames) !==
        JSON.stringify(fresh.cache.frames)
    )
      findings.push("released-quality checkpoint continuation");
    TestValidator.equals(
      "native quality policy and exact resumed states",
      findings,
      [],
    );
  }
}
