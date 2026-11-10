import {
  type advancePhysicalBalance as Balance,
  type AutoMoviePhysicalSimulation as Simulation,
  physicalContactSupportGoals,
  physicalSupportPoint,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { vclose } from "../internal/vclose";

/** Native coupled fitting retains original support intent and the correct optional plane authority.
 *
 * Scenarios:
 * 1. Stationary primitive patches carry their declared geometry and original endpoint XYZ, including accepted recovery offsets.
 * 2. Reserved, moving and stationary elevated endpoints keep their path without claiming planted contact.
 * 3. Independent policies on the same bone retain different local endpoints; no fitted output is rebound as a goal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation`, `advancePhysicalBalance`, `physicalContactSupportGoals` on in-memory inputs and asserts the returned observations through 2x TestValidator.predicate; 3 numbered scenarios (first: Stationary primitive patches carry their declared geometry and original endpoint XYZ, including accepted...; last: Independent policies on the same bone retain different local endpoints; no fitted output is rebound as a goal.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (2 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Stationary primitive patches carry their declared geometry and original endpoint XYZ, including accepted...; last: Independent policies on the same bone retain different local endpoints; no fitted output is rebound as a goal.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_intent`, which owns the cases delegated to `PhysicalModelFixtures`, `PhysicalSupportFixtures`, `vclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Stationary primitive patches carry their declared geometry and original endpoint XYZ, including accepted recovery offsets.).
 */
export function test_physical_support_intent(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: Simulation.IBody = PhysicalSupportFixtures.body(profile, 1 / 120);
  const pattern: NonNullable<Simulation.IBody["balance"]>["pattern"] =
    body.balance!.pattern;
  const limb: (typeof pattern.limbs)[number] = pattern.limbs[0]!;
  const state: Balance.IState = {
    last: "supported",
    steps: [],
    offsets: { [limb.bone]: { x: 0.02, y: 0, z: 0 } },
  };
  const target: Simulation.ITarget = body.targets[1]!;
  const original: string = JSON.stringify({ body, state });
  const goals: ReturnType<typeof physicalContactSupportGoals> =
    physicalContactSupportGoals(
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
  const point: ReturnType<typeof physicalSupportPoint> = physicalSupportPoint(
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
    physicalContactSupportGoals(
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
    physicalContactSupportGoals(
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
    physicalContactSupportGoals(
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
  const independent: typeof goals = physicalContactSupportGoals(
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
