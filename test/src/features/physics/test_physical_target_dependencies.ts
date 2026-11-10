import {
  Quaternion,
  Vector3,
  linearizePhysicalTargetRows,
  memoizePhysicalTransformValue,
  solvePhysicalArticulationTargets,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalPointFixtures } from "../internal/PhysicalPointFixtures";
import { nclose } from "../internal/predicates";

/** Borrowed candidate placements for direct primitive arithmetic. */
type Poses = Readonly<Record<string, P.ITransform>>;

/** Dirty articulation preserves published candidates and the dependencies of every residual.
 *
 * Scenarios:
 * 1. Native-coordinate updates achieve an independently predicted angle without mutating caller or prior candidate poses, and preserve every joint anchor.
 * 2. A common rotation preserves self distance while changing world-axis and fixed-world-start rows; omitted, partial and unrelated movement declarations retain their actual semantics.
 * 3. Equal coordinates reuse geometric values while in-place receiver edits invalidate the call-local scalar cache.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `linearizePhysicalTargetRows` on in-memory inputs and asserts the returned observations through 5x TestValidator.predicate; 3 numbered scenarios (first: Native-coordinate updates achieve an independently predicted angle without mutating caller or prior...; last: Equal coordinates reuse geometric values while in-place receiver edits invalidate the call-local scalar cache.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (5 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 3 numbered scenarios (first: Native-coordinate updates achieve an independently predicted angle without mutating caller or prior...; last: Equal coordinates reuse geometric values while in-place receiver edits invalidate the call-local scalar cache.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_target_dependencies`, which owns the cases delegated to `PhysicalPointFixtures`, `predicates`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Native-coordinate updates achieve an independently predicted angle without mutating caller or prior candidate poses, and preserve every...).
 */
export function test_physical_target_dependencies(): void {
  const profile: P = PhysicalPointFixtures.profile();
  const targets: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map((segment: P.ISegment): [string, P.ITransform] => [
      segment.bone,
      structuredClone(segment.neutral),
    ]),
  );
  const original: string = JSON.stringify(targets);
  const published: { poses: Poses; before: string }[] = [];
  const result: ReturnType<typeof solvePhysicalArticulationTargets> =
    solvePhysicalArticulationTargets({
      profile,
      targets,
      bones: ["carrier"],
      iterations: 24,
      tolerance: 1e-8,
      measure: (poses: Poses): number[] => {
        published.push({ poses, before: JSON.stringify(poses) });
        return [poses.source!.position.y - 1.5];
      },
    });
  TestValidator.predicate(
    "endpoint reaches its original goal",
    nclose(result.residual, 0, 1e-8),
  );
  TestValidator.predicate(
    "independent unit link requires exactly a thirty-degree turn",
    nclose(
      Math.atan2(
        result.targets.source!.position.y - 1,
        result.targets.source!.position.x,
      ),
      Math.PI / 6,
      1e-7,
    ),
  );
  assert.equal(JSON.stringify(targets), original);
  for (const observation of published)
    assert.equal(
      JSON.stringify(observation.poses),
      observation.before,
      "later probes and rejected backtracks cannot mutate earlier published poses",
    );
  for (const joint of profile.joints) {
    const first: P.ITransform["position"] = Vector3.add(
      result.targets[joint.parent]!.position,
      Quaternion.rotateVector(
        result.targets[joint.parent]!.rotation,
        joint.parentFrame.position,
      ),
    );
    const second: P.ITransform["position"] = Vector3.add(
      result.targets[joint.child]!.position,
      Quaternion.rotateVector(
        result.targets[joint.child]!.rotation,
        joint.childFrame.position,
      ),
    );
    TestValidator.predicate(
      "fixed joint anchor " + joint.id,
      nclose(Vector3.length(Vector3.subtract(first, second)), 0, 1e-12),
    );
  }

  const accepted: Record<string, P.ITransform> = {
    a: targets.source!,
    b: targets.reference!,
  };
  const angle: P.ITransform["rotation"] = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    90,
  );
  const probe: Record<string, P.ITransform> = Object.fromEntries(
    Object.entries(accepted).map(
      ([bone, pose]: [string, P.ITransform]): [string, P.ITransform] => [
        bone,
        {
          position: Quaternion.rotateVector(angle, pose.position),
          rotation: Quaternion.multiply(angle, pose.rotation),
        },
      ],
    ),
  );
  const start: P.ITransform["position"] = { ...accepted.a!.position };
  const distance: (poses: Poses) => number[] = (poses: Poses): number[] => [
    Vector3.length(Vector3.subtract(poses.a!.position, poses.b!.position)),
  ];
  const world: (poses: Poses) => number[] = (poses: Poses): number[] => [
    poses.a!.position.y - poses.b!.position.y,
  ];
  const weighted: (poses: Poses) => number[] = (poses: Poses): number[] => [
    poses.a!.position.x - (start.x + poses.b!.position.x) / 2,
  ];
  const rows: linearizePhysicalTargetRows.IRows[] = [
    distance,
    world,
    weighted,
  ].map(
    (
      measure: (poses: Poses) => number[],
      index: number,
    ): linearizePhysicalTargetRows.IRows => ({
      bones: new Set(["a", "b"]),
      rigidInvariant: index === 0,
      measure,
      linearize: (): typeof measure => measure,
    }),
  );
  const model: ReturnType<typeof linearizePhysicalTargetRows> =
    linearizePhysicalTargetRows(rows, accepted);
  compare(
    "common rigid motion only freezes intrinsic distance",
    model(probe, new Set(["a", "b"])),
    [distance(accepted)[0], world(probe)[0], weighted(probe)[0]],
  );
  compare(
    "unrelated movement keeps all baseline rows",
    model(probe, new Set(["unrelated"])),
    [distance(accepted)[0], world(accepted)[0], weighted(accepted)[0]],
  );
  compare("omission evaluates the complete actual probe", model(probe), [
    distance(probe)[0],
    world(probe)[0],
    weighted(probe)[0],
  ]);
  const partial: Poses = { ...accepted, a: probe.a! };
  compare(
    "a single moved endpoint updates the relative rows",
    model(partial, new Set(["a"])),
    [distance(partial)[0], world(partial)[0], weighted(partial)[0]],
  );

  let reads: number = 0;
  const read: (poses: Poses) => number = memoizePhysicalTransformValue(
    (poses: Poses): P.ITransform[] => [poses.a!, poses.b!],
    (poses: Poses): number => {
      reads++;
      return poses.a!.position.x - poses.b!.position.x;
    },
  );
  read(accepted);
  read({ ...accepted });
  assert.equal(
    reads,
    1,
    "a new map with identical coordinates reuses the same geometric value",
  );
  const mutable: Record<string, P.ITransform> = structuredClone(accepted);
  const prior: number = read(mutable);
  mutable.b!.position.x += 0.25;
  TestValidator.predicate(
    "in-place coordinate edits cannot hide behind a reused pose identity",
    nclose(read(mutable), prior - 0.25, 1e-12),
  );

  /** Each scalar row retains its independently evaluated world meaning. */
  function compare(
    label: string,
    actual: readonly number[],
    expected: readonly (number | undefined)[],
  ): void {
    TestValidator.predicate(
      label,
      actual.length === expected.length &&
        actual.every((value: number, index: number): boolean =>
          nclose(value, expected[index]!, 1e-12),
        ),
    );
  }
}
