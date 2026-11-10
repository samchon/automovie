import {
  Quaternion,
  Vector3,
  planPhysicalSupportTargets,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/**
 * Actual off-centre primitive joint anchors, reach-derived root drop and unchanged support goals.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `planPhysicalSupportTargets` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; the behavior its summary names. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes the behavior its summary names, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_feedback`, which owns the cases delegated to `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Actual off-centre primitive joint anchors, reach-derived root drop and unchanged support goals) as stated in this comment.
 */
export function test_physical_support_feedback(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const targets: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map(
      (segment: (typeof profile.segments)[number]): [string, P.ITransform] => [
        segment.bone,
        segment.neutral,
      ],
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
  const goal: P.ITransform["position"] = {
    ...targets["support-0"]!.position,
    x: targets["support-0"]!.position.x + 0.2,
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
  const expectedDrop: number = 0.9 - Math.sqrt(0.9 ** 2 - 0.2 ** 2);
  const failures: string[] = [];
  if (Math.abs(result.rootDrop - expectedDrop) > 1e-10)
    failures.push(`root reach: ${result.rootDrop} versus ${expectedDrop}`);
  for (const limb of pattern.limbs) {
    const error: number = Vector3.length(
      Vector3.subtract(
        result.targets[limb.bone]!.position,
        limb.bone === "support-0" ? goal : targets[limb.bone]!.position,
      ),
    );
    if (error > 0.005) failures.push(`${limb.bone}: endpoint ${error} m`);
  }
  for (const joint of profile.joints) {
    const parent: P.ITransform = result.targets[joint.parent]!;
    const child: P.ITransform = result.targets[joint.child]!;
    const a: P.ITransform["position"] = Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
    );
    const b: P.ITransform["position"] = Vector3.add(
      child.position,
      Quaternion.rotateVector(child.rotation, joint.childFrame.position),
    );
    if (Vector3.length(Vector3.subtract(a, b)) > 1e-10)
      failures.push(`${joint.id}: separated anchors`);
  }
  TestValidator.equals(
    "all support goals and articulated anchors",
    failures,
    [],
  );
}
