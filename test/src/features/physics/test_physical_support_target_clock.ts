import {
  type advancePhysicalBalance as Balance,
  AutoMoviePhysicalSimulation as Simulation,
  bindPhysicalWorld,
  physicalSupportPoint,
  samplePhysicalTarget,
  trackPhysicalBalanceTargets,
  trackPhysicalRootSupportTargets,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3 as V,
} from "@automovie/interface";
import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/** Fitted posture clocks follow interval endpoints and causal recovery revisions.
 *
 * Scenarios:
 * 1. A translating authored endpoint reaches its complete interval goal and retains the matching derivative under both fitting owners.
 * 2. A displaced actual foot cannot become a new quiet anchor.
 * 3. A new swing and accepted placement inside one interval invalidate the plan from its preceding native boundary, not frame zero or its old future endpoint.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalSimulation`, `advancePhysicalBalance`, `bindPhysicalWorld` on in-memory inputs and asserts the returned observations through 11x TestValidator.predicate; 3 numbered scenarios (first: A translating authored endpoint reaches its complete interval goal and retains the matching derivative under...; last: A new swing and accepted placement inside one interval invalidate the plan from its preceding native...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (11 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: A translating authored endpoint reaches its complete interval goal and retains the matching derivative under...; last: A new swing and accepted placement inside one interval invalidate the plan from its preceding native...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_target_clock`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`, `PhysicalSupportFixtures`, `nclose`, `qclose`, `vclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A translating authored endpoint reaches its complete interval goal and retains the matching derivative under both fitting owners.).
 */
export async function test_physical_support_target_clock(): Promise<void> {
  await RAPIER.init();
  const body: Simulation.IBody = PhysicalSupportFixtures.body(
    PhysicalModelFixtures.quadrupod(),
    1 / 120,
  );
  body.balance!.iterations = 32;
  body.balance!.targetTolerance = 1e-5;
  const pattern: NonNullable<Simulation.IBody["balance"]>["pattern"] =
    body.balance!.pattern;
  for (const pose of Object.values(body.targets[1]!.segments))
    pose.position.x += 0.001;
  body.targets[1]!.supportStrength = Object.fromEntries(
    pattern.limbs.map(
      (limb: (typeof pattern.limbs)[number]): [string, number] => [
        limb.bone,
        1,
      ],
    ),
  );
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
  input.substeps = 8;
  input.floor = 0;
  input.internalIterations = 1;
  const world: World = new RAPIER.World(input.gravity);
  try {
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      world,
      input,
      false,
    );
    const root: P.ISegment = body.profile.segments[0]!;
    const base: RigidBody = bound.segments.get(body.id)!.get(root.bone)!;
    base.setTranslation(
      { ...base.translation(), y: base.translation().y - 0.015 },
      true,
    );
    const foot: string = pattern.limbs[0]!.bone;
    const carrier: RigidBody = bound.segments.get(body.id)!.get(foot)!;
    carrier.setTranslation(
      { ...carrier.translation(), x: carrier.translation().x + 0.02 },
      true,
    );
    const state: Balance.IState = { last: "supported", steps: [], offsets: {} };
    const planted: string[] = pattern.limbs.map(
      (limb: (typeof pattern.limbs)[number]): string => limb.bone,
    );
    const goalsAt: (
      tick: number,
    ) => Record<string, ReturnType<typeof samplePhysicalTarget>> = (
      tick: number,
    ): Record<string, ReturnType<typeof samplePhysicalTarget>> =>
      Object.fromEntries(
        Object.entries(body.targets[1]!.segments).map(
          ([bone, pose]: [string, P.ITransform]): [
            string,
            ReturnType<typeof samplePhysicalTarget>,
          ] => [
            bone,
            samplePhysicalTarget(
              body.targets[0]!.segments[bone]!,
              pose,
              tick / 8,
              120,
            ),
          ],
        ),
      );
    const balanceAt: (
      tick: number,
    ) => Record<string, ReturnType<typeof samplePhysicalTarget>> = (
      tick: number,
    ): Record<string, ReturnType<typeof samplePhysicalTarget>> => {
      const goals: ReturnType<typeof goalsAt> = goalsAt(tick);
      trackPhysicalBalanceTargets({
        settings: input,
        body,
        bound,
        step: 1,
        seconds: tick / 960,
        root,
        goals,
        target: body.targets[1]!,
        planted: planted.filter(
          (bone: string): boolean => bone !== state.swing?.bone,
        ),
        state,
      });
      return goals;
    };
    const beginning: ReturnType<typeof balanceAt> = balanceAt(1);
    const first: NonNullable<ReturnType<typeof bound.planned.get>> =
      bound.planned.get(body.id)!;
    const original: V = physicalSupportPoint(
      body.targets[0]!.segments[foot]!,
      pattern.limbs[0]!.localPoint,
    );
    const end: V = physicalSupportPoint(
      first.targets[foot]!,
      pattern.limbs[0]!.localPoint,
    );
    TestValidator.predicate(
      "complete authored interval endpoint and original height",
      nclose(end.x, original.x + 0.001, 1e-5) &&
        nclose(end.y, original.y, 1e-5),
    );
    TestValidator.predicate(
      "fitted derivative follows the full interval",
      nclose(beginning[foot]!.velocity.x, 0.12, 0.002),
    );
    TestValidator.predicate(
      "native interval end reaches the fitted endpoint",
      nclose(balanceAt(8)[foot]!.pose.position.x, end.x, 1e-12),
    );

    // Both semantic revisions are sampled inside this same cache interval.
    bound.planned.clear();
    balanceAt(1);
    const beforeRevision: ReturnType<typeof balanceAt> = balanceAt(3);
    state.swing = {
      bone: foot,
      kind: "swing",
      start: 3 / 960,
      end: 3 / 960 + 0.25,
      from: { point: [original.x, original.z], yaw: 0, pitch: 0, clearance: 0 },
      to: {
        point: [original.x + 0.05, original.z],
        yaw: 0,
        pitch: 0,
        clearance: 0,
      },
    };
    state.revision = 1;
    balanceAt(4);
    const swing: NonNullable<ReturnType<typeof bound.planned.get>> =
      bound.planned.get(body.id)!;
    assert.equal(swing.revision, 1);
    TestValidator.predicate(
      "swing revision starts at the integer native boundary",
      nclose(swing.start, 3 / 960, 0),
    );
    TestValidator.predicate(
      "swing revision retains the completed prefix",
      vclose(
        swing.from[foot]!.position,
        beforeRevision[foot]!.pose.position,
        1e-12,
      ) &&
        qclose(
          swing.from[foot]!.rotation,
          beforeRevision[foot]!.pose.rotation,
          1e-14,
        ),
    );
    const progress: number = (1 / 120 - state.swing.start) / 0.25;
    const expected: number =
      original.x +
      0.05 * progress ** 3 * (10 - 15 * progress + 6 * progress ** 2);
    TestValidator.predicate(
      "recovery goal is sampled at the interval end",
      nclose(swing.targets[foot]!.position.x, expected, 1e-4),
    );
    const beforeLanding: ReturnType<typeof balanceAt> = balanceAt(5);
    state.swing = undefined;
    state.offsets[foot] = { x: 0.02, y: 0, z: 0 };
    state.revision = 2;
    balanceAt(6);
    const landed: NonNullable<ReturnType<typeof bound.planned.get>> =
      bound.planned.get(body.id)!;
    assert.equal(landed.revision, 2);
    TestValidator.predicate(
      "placement revision starts at the integer native boundary",
      nclose(landed.start, 5 / 960, 0),
    );
    TestValidator.predicate(
      "placement revision retains the completed prefix",
      vclose(
        landed.from[foot]!.position,
        beforeLanding[foot]!.pose.position,
        1e-12,
      ) &&
        qclose(
          landed.from[foot]!.rotation,
          beforeLanding[foot]!.pose.rotation,
          1e-14,
        ),
    );
    TestValidator.predicate(
      "accepted world placement remains a fixed future anchor",
      nclose(landed.targets[foot]!.position.x, original.x + 0.021, 1e-4),
    );

    bound.planned.clear();
    body.supportTracking = {
      pattern,
      stiffness: 100,
      damping: 10,
      maximumForce: 100,
      iterations: 32,
      tolerance: 1e-5,
    };
    for (const tick of [1, 8]) {
      const goals: ReturnType<typeof goalsAt> = goalsAt(tick);
      trackPhysicalRootSupportTargets({
        body,
        bound,
        target: body.targets[1]!,
        goals,
        root: {
          bone: root.bone,
          pose: { position: base.translation(), rotation: base.rotation() },
          dynamic: true,
        },
        excluded: new Set(),
        step: 1,
        seconds: tick / 960,
        nativeRate: 960,
        revision: 0,
        rate: 120,
      });
      TestValidator.predicate(
        "disjoint endpoint fit retains interval derivative",
        nclose(goals[foot]!.velocity.x, 0.12, 0.002),
      );
      if (tick === 8)
        TestValidator.predicate(
          "disjoint endpoint fit reaches the whole authored goal",
          nclose(goals[foot]!.pose.position.x, original.x + 0.001, 1e-5),
        );
    }
  } finally {
    world.free();
  }
}
