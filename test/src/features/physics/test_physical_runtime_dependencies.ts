import {
  PhysicalTargetInterval as Interval,
  Quaternion,
  type AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  bindPhysicalWorld,
  copyPhysicalTarget,
  preparePhysicalTargetSampler,
  readPhysicalScene,
  samplePhysicalAuthoredTargets,
  samplePhysicalTarget,
  setPhysicalTargetJointRotation,
  solvePhysicalChainTarget,
  warmPhysicalSupportTargets,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import RAPIER, { type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalPointFixtures } from "../internal/PhysicalPointFixtures";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/** Run-owned coordinate reuse preserves transform dependencies and caller ownership.
 *
 * Scenarios:
 * 1. Prepared coefficients match the original arithmetic, detect in-place edits, and return independent mutable vectors.
 * 2. Fitted intervals invalidate replaced/edited endpoints and altered interval clocks.
 * 3. One real native scene refresh owns only changed transforms; prior snapshots and unchanged branches survive.
 * 4. A transformed support branch whose endpoint task has no null space carries its prior local correction through an authored turn without moving unrelated ancestors.
 * 5. Direct support-chain fitting detaches its written descendants while preserving an unrelated root and the input snapshot.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 6x TestValidator.predicate; 5 numbered scenarios (first: Prepared coefficients match the original arithmetic, detect in-place edits, and return independent mutable...; last: Direct support-chain fitting detaches its written descendants while preserving an unrelated root and the...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (5 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 5 numbered scenarios (first: Prepared coefficients match the original arithmetic, detect in-place edits, and return independent mutable...; last: Direct support-chain fitting detaches its written descendants while preserving an unrelated root and the...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_runtime_dependencies`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalPointFixtures`, `qclose`, `vclose`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Prepared coefficients match the original arithmetic, detect in-place edits, and return independent mutable vectors.).
 */
export async function test_physical_runtime_dependencies(): Promise<void> {
  const before: P.ITransform = {
    position: { x: 0.3, y: -0.2, z: 1 },
    rotation: Quaternion.fromAxisAngle({ x: 1, y: 2, z: 3 }, 31),
  };
  const after: P.ITransform = {
    position: { x: 1, y: 2, z: 3 },
    rotation: Quaternion.fromAxisAngle({ x: 2, y: -1, z: 1 }, 74),
  };
  const sample: ReturnType<typeof preparePhysicalTargetSampler> =
    preparePhysicalTargetSampler(before, after, 120);
  for (const fraction of [0, 0.125, 0.5, 1]) {
    const expected: ReturnType<typeof samplePhysicalTarget> =
      samplePhysicalTarget(before, after, fraction, 120);
    const actual: typeof expected = sample(fraction);
    TestValidator.predicate(
      "prepared world motion matches the original sampler",
      vclose(actual.pose.position, expected.pose.position, 1e-13) &&
        qclose(actual.pose.rotation, expected.pose.rotation, 1e-13) &&
        vclose(actual.velocity, expected.velocity, 1e-13) &&
        vclose(actual.angularVelocity, expected.angularVelocity, 1e-13),
    );
  }
  sample(0.5).velocity.x = 12345;
  after.position.y += 0.7;
  after.rotation = Quaternion.fromAxisAngle({ x: 1, y: -1, z: 2 }, 18);
  const expected: ReturnType<typeof samplePhysicalTarget> =
    samplePhysicalTarget(before, after, 0.5, 120);
  TestValidator.predicate(
    "value edits and returned-vector mutation cannot stale coefficients",
    vclose(sample(0.5).velocity, expected.velocity) &&
      vclose(sample(0.5).angularVelocity, expected.angularVelocity),
  );
  const copied: typeof expected = copyPhysicalTarget(expected);
  copied.pose.position = { x: 9, y: 8, z: 7 };
  assert.notEqual(copied.pose.position, expected.pose.position);

  const interval: Interval.IPlan = {
    step: 1,
    revision: 0,
    start: 0,
    from: { root: before },
    targets: { root: after },
  };
  Interval.sample(interval, 1 / 240, 120);
  interval.targets.root!.position.x += 0.4;
  interval.start = 1 / 960;
  const intervalExpected: typeof expected = samplePhysicalTarget(
    before,
    after,
    Interval.fraction(interval, 1 / 240, 120),
    1 / (1 / 120 - interval.start),
  );
  const intervalActual: typeof expected = Interval.sample(
    interval,
    1 / 240,
    120,
  ).root!;
  TestValidator.predicate(
    "interval value and clock changes invalidate motion",
    vclose(intervalActual.pose.position, intervalExpected.pose.position) &&
      vclose(intervalActual.velocity, intervalExpected.velocity),
  );

  await RAPIER.init();
  const world: World = new RAPIER.World({ x: 0, y: 0, z: 0 });
  try {
    const profile: P = PhysicalPointFixtures.profile();
    const body: Simulation.IBody = PhysicalFixtures.body(
      "assembly",
      profile,
      1 / 120,
    );
    const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      world,
      input,
      false,
    );
    const scene: ReturnType<typeof readPhysicalScene> =
      readPhysicalScene(bound);
    const original: string = JSON.stringify(scene);
    bound.segments
      .get(body.id)!
      .get("carrier")!
      .setTranslation({ x: 0.4, y: 1, z: 0 }, true);
    const updated: typeof scene = readPhysicalScene(bound, scene, body.id);
    assert.equal(JSON.stringify(scene), original);
    assert.notEqual(updated.assembly!.carrier, scene.assembly!.carrier);
    assert.equal(updated.assembly!.source, scene.assembly!.source);
    assert.equal(readPhysicalScene(bound, updated, body.id), updated);
    body.targets[1]!.segments.root!.position.x = 0.1;
    const first: ReturnType<typeof samplePhysicalAuthoredTargets> =
      samplePhysicalAuthoredTargets(
        body,
        body.targets[1]!,
        bound,
        1,
        1 / 240,
        120,
      );
    body.targets[1]!.segments.root!.position.x = 0.2;
    const second: typeof first = samplePhysicalAuthoredTargets(
      body,
      body.targets[1]!,
      bound,
      1,
      1 / 240,
      120,
    );
    TestValidator.predicate(
      "authored target edits invalidate only their interval values",
      vclose(first.root!.velocity, { x: 12, y: 0, z: 0 }) &&
        vclose(second.root!.velocity, { x: 24, y: 0, z: 0 }),
    );

    const global: P.ITransform["rotation"] = Quaternion.fromAxisAngle(
      { x: 1, y: 2, z: -1 },
      37,
    );
    const root: P.ITransform["position"] = { x: 0.2, y: 2, z: -0.7 };
    const poses: Record<string, P.ITransform> = Object.fromEntries(
      profile.segments.map((segment: P.ISegment): [string, P.ITransform] => [
        segment.bone,
        {
          position: Vector3.add(
            root,
            Quaternion.rotateVector(
              global,
              Vector3.subtract(
                segment.neutral.position,
                profile.segments[0]!.neutral.position,
              ),
            ),
          ),
          rotation: { ...global },
        },
      ]),
    );
    const prior: typeof poses = structuredClone(poses);
    const current: typeof poses = structuredClone(poses);
    const joint: P.IJoint = profile.joints[0]!;
    setPhysicalTargetJointRotation(
      prior,
      joint,
      bound.descendants.get(body.id)!.get("carrier")!,
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 30),
    );
    setPhysicalTargetJointRotation(
      current,
      joint,
      bound.descendants.get(body.id)!.get("carrier")!,
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 10),
    );
    const unchanged: string = JSON.stringify({ poses, current, prior });
    const warmed: typeof poses = warmPhysicalSupportTargets({
      order: bound.order.get(body.id)!,
      joints: bound.jointByChild.get(body.id)!,
      descendants: bound.descendants.get(body.id)!,
      selected: new Set(["carrier"]),
      targets: current,
      before: poses,
      previous: prior,
      // The endpoint fully determines the carrier coordinate, so the
      // support task has no null space and the whole correction stays warm.
      pattern: {
        id: "carrier-endpoint",
        minimumSupports: 0,
        limbs: [
          {
            bone: "source",
            chain: ["carrier", "source"],
            phase: 0,
            duty: 1,
            offset: { forward: 0, left: 0 },
            stride: [],
          },
        ],
      },
      planted: new Set(),
      tolerance: 1e-9,
    });
    const angle: number = (40 * Math.PI) / 180;
    TestValidator.predicate(
      "prior local correction follows authored rotation in a transformed frame",
      qclose(
        warmed.carrier!.rotation,
        Quaternion.multiply(
          global,
          Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 40),
        ),
      ) &&
        vclose(
          warmed.source!.position,
          Vector3.add(
            root,
            Quaternion.rotateVector(global, {
              x: Math.cos(angle),
              y: Math.sin(angle),
              z: 0,
            }),
          ),
          1e-12,
        ),
    );
    assert.equal(warmed.root, current.root);
    const fitted: ReturnType<typeof solvePhysicalChainTarget> =
      solvePhysicalChainTarget({
        profile,
        chain: ["carrier", "source"],
        targets: current,
        goal: warmed.source!.position,
        iterations: 24,
        tolerance: 1e-8,
      });
    TestValidator.predicate(
      "support-chain COW retains exact transformed endpoint fitting",
      vclose(fitted.targets.source!.position, warmed.source!.position, 1e-8),
    );
    assert.equal(fitted.targets.root, current.root);
    assert.equal(JSON.stringify({ poses, current, prior }), unchanged);
  } finally {
    world.free();
  }
}
