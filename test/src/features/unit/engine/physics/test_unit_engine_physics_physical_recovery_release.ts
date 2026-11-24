import {
  AutoMovieXpbdBody,
  type AutoMovieXpbdWorld,
  advancePhysicalBalance as Balance,
  Vector3,
  bindPhysicalWorld,
  trackPhysicalWorld,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../../../internal/PhysicalSupportFixtures";
import { physicalSolverWorld } from "../../../internal/physicalSolverWorld";

/** Exhausted recovery clears every new force, while real reacquired support restores effort.
 *
 * Scenarios:
 * 1. A retained endpoint offset cannot leak fresh world force after repeated withdrawal.
 * 2. Actual solver floor contacts clear a previous failed-landing latch without a special bracing policy.
 */
export async function test_unit_engine_physics_physical_recovery_release(): Promise<void> {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.body(profile, 1);
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([body], 1);
  Object.assign(input, {
    gravity: { x: 0, y: -9.81, z: 0 },
    substeps: 4,
    contactTolerance: 0.0001,
    contactFrequency: 240,
  });
  {
    const world: AutoMovieXpbdWorld = physicalSolverWorld(input);
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      world,
      input,
      false,
    );
    const state: IAutoMoviePhysicalRecoveryState = {
      last: "unrecoverable",
      failedLanding: true,
      lostSince: 0,
      steps: [],
      offsets: { "support-0": { x: 0.1, y: 0, z: 0 } },
    };
    for (const seconds of [0.9, 0.91]) {
      trackPhysicalWorld(
        world,
        input,
        bound,
        120,
        new Map(),
        [],
        { [body.id]: state },
        [],
        seconds,
      );
      TestValidator.predicate(
        "every released substep clears new recovery force",
        [...bound.segments.get(body.id)!.values()].every(
          (rigid: AutoMovieXpbdBody): boolean =>
            Vector3.length(rigid.userForce()) === 0 &&
            Vector3.length(rigid.userTorque()) === 0,
        ),
      );
    }
  }
  const floorInput: IAutoMoviePhysicalSimulationInput.IInput =
    structuredClone(input);
  floorInput.floor = 0;
  {
    const landed: AutoMovieXpbdWorld = physicalSolverWorld(floorInput);
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      landed,
      floorInput,
      false,
    );
    for (let step: number = 0; step < 4; step++) landed.step();
    const state: IAutoMoviePhysicalRecoveryState = {
      last: "unrecoverable",
      failedLanding: true,
      lostSince: 0,
      steps: [],
      offsets: {},
    };
    const result: ReturnType<typeof Balance> = Balance({
      world: landed,
      body: body.id,
      profile,
      segments: bound.segments.get(body.id)!,
      colliders: bound.colliders,
      contacts: [],
      policy: body.balance!,
      state,
      targets: body.targets[0]!.segments,
      seconds: 4 / 480,
      dt: 1 / 480,
      gravity: 9.81,
      floor: 0,
    });
    TestValidator.predicate(
      "real support restores bounded effort after an earlier failure",
      result.state.last === "supported" &&
        result.state.failedLanding === undefined &&
        result.rootStrength === 1,
    );
  }
}
