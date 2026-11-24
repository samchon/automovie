import {
  Quaternion,
  Vector3,
  planPhysicalSupportTargets,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMovieRigidTransform,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";

/**
 * Actual off-centre primitive joint anchors, reach-derived root drop and
 * unchanged support goals.
 */
export function test_unit_engine_physics_physical_support_feedback(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const targets: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    profile.segments.map(
      (
        segment: (typeof profile.segments)[number],
      ): [string, IAutoMovieRigidTransform] => [segment.bone, segment.neutral],
    ),
  );
  const pattern: IAutoMovieFootfallPattern = {
    id: "four-independent-chains",
    minimumSupports: 3,
    limbs: Array.from(
      { length: 4 },
      (
        _: unknown,
        index: number,
      ): {
        bone: string;
        chain: string[];
        reach: { root: string; middle: string; tip: string };
        phase: number;
        duty: number;
        offset: { forward: number; left: number };
        stride: { speed: number; length: number }[];
      } => ({
        bone: `support-${index}`,
        chain: [`upper-${index}`, `lower-${index}`, `support-${index}`],
        reach: {
          root: `upper-${index}`,
          middle: `lower-${index}`,
          tip: `support-${index}`,
        },
        phase: index / 4,
        duty: 0.75,
        offset: { forward: 0, left: 0 },
        stride: [{ speed: 0, length: 0.6 }],
      }),
    ),
  };
  // The hip and ankle from the fixture's own joint anchors: its bent knees
  // hold the ankle 2 * 0.45 cos(pi / 8) m under the hip, so the root drops
  // only by what a straight 0.9 m leg still lacks, none for a 0.2 m reach and a nonzero drop for 0.45 m.
  const anchor = (child: string): IAutoMovieRigidTransform["position"] => {
    const joint = profile.joints.find(
      (candidate) => candidate.child === child,
    )!;
    const parent: IAutoMovieRigidTransform = targets[joint.parent]!;
    return Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
    );
  };
  const failures: string[] = [];
  for (const reach of [0.2, 0.45]) {
    const goal: IAutoMovieRigidTransform["position"] = {
      ...targets["support-0"]!.position,
      x: targets["support-0"]!.position.x + reach,
    };
    const result: ReturnType<typeof planPhysicalSupportTargets> =
      planPhysicalSupportTargets({
        profile,
        pattern,
        targets,
        goals: { "support-0": goal },
        maximumRootDrop: 0.15,
        iterations: 48,
        tolerance: 0.0001,
      });
    const expectedDrop: number = Math.max(
      0,
      anchor("upper-0").y -
        anchor("support-0").y -
        Math.sqrt(0.9 ** 2 - reach ** 2),
    );
    if (reach > 0.2 && !(expectedDrop > 0))
      failures.push(`: the case needs a drop`);
    if (Math.abs(result.rootDrop - expectedDrop) > 1e-10)
      failures.push(
        `${reach}: root reach ${result.rootDrop} versus ${expectedDrop}`,
      );
    for (const limb of pattern.limbs) {
      const error: number = Vector3.length(
        Vector3.subtract(
          result.targets[limb.bone]!.position,
          limb.bone === "support-0" ? goal : targets[limb.bone]!.position,
        ),
      );
      if (error > 0.005)
        failures.push(`${reach}: ${limb.bone} endpoint ${error} m`);
    }
    for (const joint of profile.joints) {
      const parent: IAutoMovieRigidTransform = result.targets[joint.parent]!;
      const child: IAutoMovieRigidTransform = result.targets[joint.child]!;
      const a: IAutoMovieRigidTransform["position"] = Vector3.add(
        parent.position,
        Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
      );
      const b: IAutoMovieRigidTransform["position"] = Vector3.add(
        child.position,
        Quaternion.rotateVector(child.rotation, joint.childFrame.position),
      );
      if (Vector3.length(Vector3.subtract(a, b)) > 1e-10)
        failures.push(`${reach}: ${joint.id} separated anchors`);
    }
  }
  TestValidator.equals(
    "all support goals and articulated anchors",
    failures,
    [],
  );
}
