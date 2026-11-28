import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../../internal/PhysicalSupportFixtures";
import { vclose } from "../../internal/vclose";

/**
 * Native coupled fitting retains original support intent and the correct
 * optional plane authority.
 *
 * Scenarios:
 *
 * 1. Stationary primitive patches carry their declared geometry and original
 *    endpoint XYZ, including accepted recovery offsets.
 * 2. Reserved, moving and stationary elevated endpoints keep their path without
 *    claiming planted contact.
 * 3. Independent policies on the same bone retain different local endpoints; no
 *    fitted output is rebound as a goal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies when a stationary support declares a plane, how original local endpoints are retained, and how recovery translation adjusts them.
 * @evidence contracts/development/testing.md#behavioral-verification Builds goals for planted, reserved, moving and elevated endpoints and fits distinct policies on one bone.
 * @evidence contracts/development/testing.md#independent-expectations Authored endpoint and accepted translation determine the final goal independently of the fitted pose. The unplanted cases retain their path without gaining a plane.
 */
export function test_engine_physics_physical_contact_support_goals(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: IAutoMoviePhysicalSimulationInput.IBody =
    PhysicalSupportFixtures.body(profile, 1 / 120);
  const pattern: NonNullable<
    IAutoMoviePhysicalSimulationInput.IBody["balance"]
  >["pattern"] = body.balance!.pattern;
  const limb: (typeof pattern.limbs)[number] = pattern.limbs[0]!;
  const state: IAutoMoviePhysicalRecoveryState = {
    last: "supported",
    steps: [],
    offsets: { [limb.bone]: { x: 0.02, y: 0, z: 0 } },
  };
  const target: IAutoMoviePhysicalSimulationInput.ITarget = body.targets[1]!;
  const original: string = JSON.stringify({ body, state });
  const goals: ReturnType<typeof AutoMovieEnginePhysics.physicalContactSupportGoals> =
    AutoMovieEnginePhysics.physicalContactSupportGoals(
      body,
      target,
      0,
      0.0001,
      1 / 120,
      120,
      1,
      state,
    );
  const selected: (typeof goals)[number] = goals.find(
    (goal: (typeof goals)[number]): boolean => goal.bone === limb.bone,
  )!;
  const point: ReturnType<typeof AutoMovieEnginePhysics.physicalSupportPoint> = AutoMovieEnginePhysics.physicalSupportPoint(
    target.segments[limb.bone]!,
    limb.localPoint,
  );
  TestValidator.predicate(
    "original endpoint plus accepted translation survives coupled fitting",
    vclose(selected.point, { ...point, x: point.x + 0.02 }) &&
      selected.patch !== undefined &&
      selected.patch.contacts.includes(limb.bone),
  );
  assert.equal(JSON.stringify({ body, state }), original);

  target.unavailableSupports = [limb.bone];
  assert.equal(
    AutoMovieEnginePhysics.physicalContactSupportGoals(
      body,
      target,
      0,
      0.0001,
      1 / 120,
      120,
      1,
      state,
    ).find((goal: (typeof goals)[number]): boolean => goal.bone === limb.bone)!
      .patch,
    undefined,
  );
  target.unavailableSupports = [];
  target.segments[limb.bone]!.position.y += 0.1;
  assert.equal(
    AutoMovieEnginePhysics.physicalContactSupportGoals(
      body,
      target,
      0,
      0.0001,
      1 / 120,
      120,
      1,
      state,
    ).find((goal: (typeof goals)[number]): boolean => goal.bone === limb.bone)!
      .patch,
    undefined,
  );
  body.targets[0]!.segments[limb.bone]!.position.y += 0.1;
  assert.equal(
    AutoMovieEnginePhysics.physicalContactSupportGoals(
      body,
      target,
      0,
      0.0001,
      1 / 120,
      120,
      1,
      state,
    ).find((goal: (typeof goals)[number]): boolean => goal.bone === limb.bone)!
      .patch,
    undefined,
  );
  body.targets[0]!.segments[limb.bone]!.position.y -= 0.1;
  target.segments[limb.bone]!.position.y -= 0.1;

  body.supportTracking = {
    pattern: {
      ...pattern,
      limbs: [{ ...limb, localPoint: { x: 0.005, y: 0, z: 0 } }],
    },
    stiffness: 1,
    damping: 1,
    maximumForce: 1,
  };
  target.supportStrength = { [limb.bone]: 1 };
  const independent: typeof goals = AutoMovieEnginePhysics.physicalContactSupportGoals(
    body,
    target,
    0,
    0.0001,
    1 / 120,
    120,
    1,
    state,
  ).filter((goal: (typeof goals)[number]): boolean => goal.bone === limb.bone);
  TestValidator.predicate(
    "independent local endpoint policies are not conflated",
    independent.length === 2 &&
      vclose(independent[1]!.point, {
        ...independent[0]!.point,
        x: independent[0]!.point.x + 0.005,
      }),
  );
}
