import {
  preparePhysicalGeometry as Geometry,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  planPhysicalContactTargets as plan,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalPointBound as Bound,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalPointFixtures } from "../internal/PhysicalPointFixtures";

/** Independent analytic point corridors share the actual bounded articulation solver.
 *
 * Scenarios:
 * 1. A shared ancestor carries both source and same-body reference coherently.
 * 2. Moving external references select independently predicted asin angles.
 * 3. An unreachable interval retains its metre error without changing link lengths.
 * 4. Authored and native-kinematic consumers use the same fitted endpoint.
 * 5. Relationship counts, finite sides, residual rows and malformed data refuse before allocation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Vector3`, `AutoMoviePhysicalSimulation`, `planPhysicalContactTargets` on in-memory inputs and asserts the returned observations through 4x TestValidator.predicate, 1x TestValidator.equals; 5 numbered scenarios (first: A shared ancestor carries both source and same-body reference coherently.; last: Relationship counts, finite sides, residual rows and malformed data refuse before allocation.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (4 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: A shared ancestor carries both source and same-body reference coherently.; last: Relationship counts, finite sides, residual rows and malformed data refuse before allocation.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_point_bounds`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalPointFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A shared ancestor carries both source and same-body reference coherently.).
 */
export async function test_physical_point_bounds(): Promise<void> {
  const profile: P = PhysicalPointFixtures.profile();
  const receiver: P = PhysicalFixtures.sphere(0.01);
  const body: Simulation.IBody = PhysicalFixtures.body(
    "assembly",
    profile,
    1 / 120,
  );
  const other: Simulation.IBody = PhysicalFixtures.body(
    "receiver",
    receiver,
    1 / 120,
  );
  const input: Simulation.IInput = PhysicalFixtures.input(
    [body, other],
    1 / 120,
  );
  const geometry: Geometry.IQueries = await Geometry();
  const targets: Record<string, P.ITransform> = body.targets[0]!.segments;
  const bound: Bound = PhysicalPointFixtures.bound();
  const before: string = JSON.stringify({ targets, bound });
  const fit: (
    relationship: Bound,
    height?: number,
  ) => ReturnType<typeof plan> = (
    relationship: Bound,
    height: number = 1,
  ): ReturnType<typeof plan> =>
    plan({
      body: body.id,
      profiles: { assembly: profile, receiver },
      targets,
      actual: {
        assembly: targets,
        receiver: {
          root: {
            position: { x: 0, y: height, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          },
        },
      },
      bindings: [],
      pointBounds: [relationship],
      geometry,
      floor: -10,
    });
  const shared: ReturnType<typeof plan> = fit(bound);
  const turn: (poses: Record<string, P.ITransform>) => number = (
    poses: Record<string, P.ITransform>,
  ): number =>
    Math.atan2(
      poses.source!.position.y - poses.carrier!.position.y,
      poses.source!.position.x - poses.carrier!.position.x,
    );
  TestValidator.predicate(
    "candidate reference follows shared carrier rather than old head placement",
    Math.abs(turn(shared.targets) - Math.PI / 4) < 1e-5 &&
      Math.abs(
        shared.targets.source!.position.y -
          shared.targets.reference!.position.y,
      ) < 1e-6 &&
      shared.residuals[bound.id]! < 1e-6,
  );
  const external: Bound = {
    ...structuredClone(bound),
    reference: {
      body: "receiver",
      bone: "root",
      localPoint: { x: 0, y: 0, z: 0 },
    },
  };
  for (const height of [1.5, 1.6]) {
    const result: ReturnType<typeof plan> = fit(external, height);
    TestValidator.predicate(
      "external actual point moves its fitted target",
      Math.abs(turn(result.targets) - Math.asin(height - 1)) < 1e-5 &&
        result.residuals[external.id]! < 1e-6,
    );
  }
  const impossible: Bound = { ...external, minimum: 2, maximum: undefined };
  const failed: ReturnType<typeof plan> = fit(impossible);
  TestValidator.predicate(
    "unreachable interval retains error and unit link",
    failed.residuals[impossible.id]! >= 1 - 1e-6 &&
      Math.abs(
        Vector3.length(
          Vector3.subtract(
            failed.targets.source!.position,
            failed.targets.carrier!.position,
          ),
        ) - 1,
      ) < 1e-10 &&
      Vector3.length(
        Vector3.subtract(failed.targets.root!.position, targets.root!.position),
      ) < 1e-12,
  );
  TestValidator.equals(
    "borrowed geometric inputs remain unchanged",
    JSON.stringify({ targets, bound }),
    before,
  );
  for (const mode of ["kinematic", "simulated"] as const) {
    const consumer: Simulation.IInput = structuredClone(input);
    for (const actor of consumer.bodies) {
      actor.mode = { kind: mode };
      for (const target of actor.targets) {
        target.dynamicSegments = [];
        target.strength = 1;
      }
    }
    for (const target of consumer.bodies[0]!.targets)
      target.pointBounds = [structuredClone(bound)];
    const run: Simulation = await Simulation.compute(consumer);
    TestValidator.predicate(
      "consumer dispatch fits point-only target",
      Math.abs(turn(run.cache.at(1 / 120).bodies.assembly!) - Math.PI / 4) <
        1e-5,
    );
  }
  const mutations: ((value: Bound) => void)[] = [
    (value: Bound): void => {
      value.axis = { x: 0, y: 0, z: 0 };
    },
    (value: Bound): void => {
      value.axis.y = NaN;
    },
    (value: Bound): void => {
      value.minimum = 1;
      value.maximum = -1;
    },
    (value: Bound): void => {
      value.minimum = undefined;
      value.maximum = undefined;
    },
    (value: Bound): void => {
      value.minimum = Infinity;
    },
    (value: Bound): void => {
      value.reference.bone = "absent";
    },
    (value: Bound): void => {
      value.source.localPoint.x = 1e100;
    },
    (value: Bound): void => {
      value.chain = ["root"];
      value.source.bone = "root";
    },
    (value: Bound): void => {
      value.tolerance = NaN;
    },
  ];
  for (const mutate of mutations) {
    const invalid: Simulation.IInput = structuredClone(input);
    const value: Bound = structuredClone(bound);
    mutate(value);
    invalid.bodies[0]!.targets[0]!.pointBounds = [value];
    assert.throws((): string => Simulation.identity(invalid), /point/);
  }
  body.targets[0]!.pointBounds = Array.from(
    { length: 17 },
    (_: unknown, index: number): Bound => ({
      ...structuredClone(bound),
      id: `count-${index}`,
    }),
  );
  assert.throws((): string => Simulation.identity(input), /budget/);
  body.maximumBindings = 17;
  Simulation.identity(input);
  body.targets[0]!.pointBounds[1]!.id = body.targets[0]!.pointBounds[0]!.id;
  assert.throws((): string => Simulation.identity(input), /point/);
  const compound: Simulation.IInput = structuredClone(input);
  const dense: Simulation.IBody = compound.bodies[0]!;
  for (const segment of dense.profile.segments)
    segment.shapes = Array.from(
      { length: 250 },
      (_: unknown, index: number): P.IShape => ({
        ...structuredClone(segment.shapes[0]!),
        id: `surface-${index}`,
      }),
    );
  dense.targets[0]!.pointBounds = Array.from(
    { length: 12 },
    (_: unknown, index: number): Bound => ({
      ...structuredClone(bound),
      id: `row-${index}`,
    }),
  );
  // 1000 floor rows plus twelve two-sided intervals are exactly1024 rows.
  Simulation.identity(compound);
  dense.targets[0]!.pointBounds.push({
    ...structuredClone(bound),
    id: "over-row-budget",
  });
  assert.throws((): string => Simulation.identity(compound), /residual budget/);
}
