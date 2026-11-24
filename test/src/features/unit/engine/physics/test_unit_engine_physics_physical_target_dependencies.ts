import {
  Quaternion,
  Vector3,
  linearizePhysicalTargetRows,
  solvePhysicalArticulationTargets,
} from "@automovie/engine";
import type {
  IAutoMovieLinearizePhysicalTargetRows,
  IAutoMoviePhysicalSegment,
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalPointFixtures } from "../../../internal/PhysicalPointFixtures";
import { nclose } from "../../../internal/predicates";

/** Borrowed candidate placements for direct primitive arithmetic. */
type Poses = Readonly<Record<string, IAutoMovieRigidTransform>>;

/**
 * Dirty articulation preserves published candidates and the dependencies of
 * every residual.
 *
 * Scenarios:
 *
 * 1. Native-coordinate updates achieve an independently predicted angle without
 *    mutating caller or prior candidate poses, and preserve every joint
 *    anchor.
 * 2. A common rotation preserves self distance while changing world-axis and
 *    fixed-world-start rows; omitted, partial and unrelated movement
 *    declarations retain their actual semantics.
 */
export function test_unit_engine_physics_physical_target_dependencies(): void {
  const profile: P = PhysicalPointFixtures.profile();
  const targets: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    profile.segments.map(
      (
        segment: IAutoMoviePhysicalSegment,
      ): [string, IAutoMovieRigidTransform] => [
        segment.bone,
        structuredClone(segment.neutral),
      ],
    ),
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
    const first: IAutoMovieRigidTransform["position"] = Vector3.add(
      result.targets[joint.parent]!.position,
      Quaternion.rotateVector(
        result.targets[joint.parent]!.rotation,
        joint.parentFrame.position,
      ),
    );
    const second: IAutoMovieRigidTransform["position"] = Vector3.add(
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

  const accepted: Record<string, IAutoMovieRigidTransform> = {
    a: targets.source!,
    b: targets.reference!,
  };
  const angle: IAutoMovieRigidTransform["rotation"] = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    90,
  );
  const probe: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    Object.entries(accepted).map(
      ([bone, pose]: [string, IAutoMovieRigidTransform]): [
        string,
        IAutoMovieRigidTransform,
      ] => [
        bone,
        {
          position: Quaternion.rotateVector(angle, pose.position),
          rotation: Quaternion.multiply(angle, pose.rotation),
        },
      ],
    ),
  );
  const start: IAutoMovieRigidTransform["position"] = {
    ...accepted.a!.position,
  };
  const distance: (poses: Poses) => number[] = (poses: Poses): number[] => [
    Vector3.length(Vector3.subtract(poses.a!.position, poses.b!.position)),
  ];
  const world: (poses: Poses) => number[] = (poses: Poses): number[] => [
    poses.a!.position.y - poses.b!.position.y,
  ];
  const weighted: (poses: Poses) => number[] = (poses: Poses): number[] => [
    poses.a!.position.x - (start.x + poses.b!.position.x) / 2,
  ];
  const rows: IAutoMovieLinearizePhysicalTargetRows.IRows[] = [
    distance,
    world,
    weighted,
  ].map(
    (
      measure: (poses: Poses) => number[],
      index: number,
    ): IAutoMovieLinearizePhysicalTargetRows.IRows => ({
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
