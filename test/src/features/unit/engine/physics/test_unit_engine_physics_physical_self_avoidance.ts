import {
  preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
  isPhysicalProfilePairExcluded,
  planPhysicalContactTargets,
  setPhysicalTargetJointRotation,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalSegment,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";

/**
 * Profile-wide avoidance derives enabled pairs from geometry and the joint
 * tree.
 *
 * Scenarios:
 *
 * 1. A folded primitive branch penetrates its trunk without any named part
 *    catalogue.
 * 2. Coupled fitting reduces that penetration while retaining the actual root.
 * 3. Direct neighbours and explicitly excluded overlapping pivot regions stay
 *    excluded.
 */
export async function test_unit_engine_physics_physical_self_avoidance(): Promise<void> {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries = await Geometry();
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
  const joint: IAutoMoviePhysicalJoint = profile.joints.find(
    (candidate: IAutoMoviePhysicalJoint): boolean =>
      candidate.child === "upper-0",
  )!;
  setPhysicalTargetJointRotation(
    targets,
    joint,
    ["upper-0", "lower-0", "support-0"],
    Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -85),
  );
  const fitted: ReturnType<typeof planPhysicalContactTargets> =
    planPhysicalContactTargets({
      body: "mechanism",
      profiles: { mechanism: profile },
      targets,
      actual: { mechanism: targets },
      bindings: [],
      selfAvoidance: { iterations: 24, tolerance: 0.0001 },
      geometry,
      floor: -10,
    });
  const before: number = penetration(targets);
  const after: number = penetration(fitted.targets);
  TestValidator.predicate(
    "independent branch collision is present and reduced",
    (): boolean => before > 0.02 && after < before / 2,
  );
  TestValidator.equals(
    "fitting retains actual root",
    fitted.targets.body,
    targets.body,
  );
  TestValidator.predicate("joint neighbours excluded", (): boolean =>
    isPhysicalProfilePairExcluded(profile, "body", "upper-0"),
  );
  const excluded: P = {
    ...profile,
    collisionExclusions: [
      {
        a: "body",
        b: "lower-0",
        reason: "Explicitly overlapping test pivot region",
      },
    ],
  };
  TestValidator.predicate("provider pivot exclusion retained", (): boolean =>
    isPhysicalProfilePairExcluded(excluded, "lower-0", "body"),
  );

  const shifted: Record<string, IAutoMovieRigidTransform> =
    structuredClone(targets);
  shifted.body!.position.x += 0.2;
  const connected: ReturnType<typeof planPhysicalContactTargets> =
    planPhysicalContactTargets({
      body: "mechanism",
      profiles: { mechanism: profile },
      targets: shifted,
      actual: { mechanism: targets },
      bindings: [],
      selfAvoidance: { iterations: 24, tolerance: 0.0001 },
      geometry,
      floor: -10,
    });
  for (const connection of profile.joints) {
    const parent: IAutoMovieRigidTransform =
      connected.targets[connection.parent]!;
    const child: IAutoMovieRigidTransform =
      connected.targets[connection.child]!;
    const first: IAutoMovieRigidTransform["position"] = Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, connection.parentFrame.position),
    );
    const second: IAutoMovieRigidTransform["position"] = Vector3.add(
      child.position,
      Quaternion.rotateVector(child.rotation, connection.childFrame.position),
    );
    TestValidator.predicate(
      "root-only feedback cannot disconnect " + connection.id,
      Vector3.length(Vector3.subtract(first, second)) < PhysicalTolerance.ACCUMULATED,
    );
  }

  /** Observe the worst actual enabled penetration through native geometry. */
  function penetration(
    poses: Record<string, IAutoMovieRigidTransform>,
  ): number {
    let result: number = 0;
    for (const [index, first] of profile.segments.entries())
      for (const second of profile.segments.slice(index + 1)) {
        if (isPhysicalProfilePairExcluded(profile, first.bone, second.bone))
          continue;
        for (const a of first.shapes)
          for (const b of second.shapes)
            result = Math.max(
              result,
              -(
                geometry.contact(
                  {
                    body: "mechanism",
                    bone: first.bone,
                    shape: a,
                    pose: poses[first.bone]!,
                  },
                  {
                    body: "mechanism",
                    bone: second.bone,
                    shape: b,
                    pose: poses[second.bone]!,
                  },
                  0,
                )?.separation ?? 0
              ),
            );
      }
    return result;
  }
}
