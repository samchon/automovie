import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type {
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Twenty-four fixed steps cover release, return and one continuation. */
const DURATION: number = 0.2;

/** Steps between retained solver checkpoints. */
const CHECKPOINT: number = 4;

/** Step where authored strength returns. */
const RETURN: number = 12;

/** Step of the impulse that the released body receives. */
const IMPULSE: number = 3;

/** First edited step, inside the release after its checkpoint. */
const EDIT: number = 9;

/** A released body resumes from its checkpoint exactly.
 *
 * Scenarios:
 * 1. A released sphere, whose tracking strength is zero until authored control returns, takes an impulse; an impulse edited inside the release resumes from the last checkpoint and matches a fresh computation exactly.
 * 2. The same holds for an articulation released at the root while one joint keeps reflex effort.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation` fresh and resumed on the edited input and compares the recomputed step count and every cached frame.
 * @evidence contracts/development/testing.md#independent-expectations The resumed run recomputes exactly the steps after the last checkpoint before the edit, and its frames equal the fresh run's bit for bit.
 * @evidence contracts/development/testing.md#distinguishing-cases A fully released single body against an articulation with reflex joint effort.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_physical_release_resume`; it starts no process or viewer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists both scenarios and what each pins.
 */ export async function test_physical_release_resume(): Promise<void> {
  for (const reflex of [false, true]) {
    const body: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
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
    });
    for (const [step, target] of body.targets.entries())
      target.strength = step < RETURN ? 0 : 1;
    if (reflex)
      for (const target of body.targets)
        target.jointStrength = { [body.profile.joints[0]!.id]: 0.2 };
    const input: IAutoMoviePhysicalSimulationInput.IInput =
      PhysicalFixtures.input([body], DURATION);
    input.checkpointEvery = CHECKPOINT;
    input.impulses.push({
      step: IMPULSE,
      body: body.id,
      bone: root,
      point: { x: 0, y: 1, z: 0 },
      impulse: { x: 1, y: 0, z: 0 },
    });
    const baseline: IAutoMoviePhysicalSimulation =
      await Simulation.compute(input);
    const findings: string[] = [];
    const edited: IAutoMoviePhysicalSimulationInput.IInput =
      structuredClone(input);
    edited.impulses.push({
      step: EDIT,
      body: body.id,
      bone: root,
      point: { x: 0, y: 1, z: 0 },
      impulse: { x: 0.2, y: 0, z: 0 },
    });
    const fresh: IAutoMoviePhysicalSimulation =
      await Simulation.compute(edited);
    const resumed: IAutoMoviePhysicalSimulation = await Simulation.compute(
      edited,
      baseline,
    );
    if (
      resumed.recomputedSteps !==
        input.maximumSteps - Math.floor(EDIT / CHECKPOINT) * CHECKPOINT ||
      JSON.stringify(resumed.cache.frames) !==
        JSON.stringify(fresh.cache.frames)
    )
      findings.push("released checkpoint continuation");
    TestValidator.equals(
      "exact resumed states of a released body",
      findings,
      [],
    );
  }
}
