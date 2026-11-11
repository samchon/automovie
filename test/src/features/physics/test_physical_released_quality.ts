import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Twenty-four native steps cover release, return and one continuation. */
const DURATION: number = 0.2;

/** Steps between retained native checkpoints. */
const CHECKPOINT: number = 4;

/** Step where authored strength returns. */
const RETURN: number = 12;

/** Step of the impulse that the released body receives. */
const IMPULSE: number = 3;

/** Checkpoint inside the release, carrying the released budget. */
const RELEASED: number = 8;

/** Checkpoint after the return, with the budget withdrawn. */
const RETURNED: number = 16;

/** First edited step, inside the release after its checkpoint. */
const EDIT: number = 9;

/** Native per-island quality survives checkpoints and is withdrawn when authored control returns.
 *
 * Scenarios:
 * 1. A released sphere and an articulation under reflex joint effort carry the declared extra solver budget in a restored checkpoint.
 * 2. Returned authored strength withdraws that budget in a later checkpoint.
 * 3. An edited impulse resumes from the last checkpoint and matches a fresh computation exactly.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; 3 numbered scenarios (first: A released sphere and an articulation under reflex joint effort carry the declared extra solver budget in a...; last: An edited impulse resumes from the last checkpoint and matches a fresh computation exactly.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A released sphere and an articulation under reflex joint effort carry the declared extra solver budget in a...; last: An edited impulse resumes from the last checkpoint and matches a fresh computation exactly.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_released_quality`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A released sphere and an articulation under reflex joint effort carry the declared extra solver budget in a restored checkpoint.).
 */
export async function test_physical_released_quality(): Promise<void> {
  for (const reflex of [false, true]) {
    const body: Simulation.IBody = PhysicalFixtures.body(
      reflex ? "articulation" : "ball",
      reflex
        ? PhysicalModelFixtures.stickman().profile
        : PhysicalFixtures.sphere(),
      DURATION,
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
      target.strength = step < RETURN ? 0 : 1;
    if (reflex)
      for (const target of body.targets)
        target.jointStrength = { [body.profile.joints[0]!.id]: 0.2 };
    const input: Simulation.IInput = PhysicalFixtures.input([body], DURATION);
    input.checkpointEvery = CHECKPOINT;
    input.impulses.push({
      step: IMPULSE,
      body: body.id,
      bone: root,
      point: { x: 0, y: 1, z: 0 },
      impulse: { x: 1, y: 0, z: 0 },
    });
    const baseline: Simulation = await Simulation.compute(input);
    const findings: string[] = [];
    for (const [step, expected] of [
      [RELEASED, [8, 7]],
      [RETURNED, [0, 0]],
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
      step: EDIT,
      body: body.id,
      bone: root,
      point: { x: 0, y: 1, z: 0 },
      impulse: { x: 0.2, y: 0, z: 0 },
    });
    const fresh: Simulation = await Simulation.compute(edited);
    const resumed: Simulation = await Simulation.compute(edited, baseline);
    if (
      resumed.recomputedSteps !==
        input.maximumSteps - Math.floor(EDIT / CHECKPOINT) * CHECKPOINT ||
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
