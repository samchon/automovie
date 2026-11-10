import {
  Quaternion,
  Vector3,
  physicalSupportPoint,
  planPhysicalSupportTargets,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/**
 * The existing stickman's shin-tip supports share generic reach planning without adding foot bones.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `physicalSupportPoint` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; the behavior its summary names. A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes the behavior its summary names, including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_endpoints`, which owns the cases delegated to `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (The existing stickman's shin-tip supports share generic reach planning without adding foot bones) as stated in this comment.
 */
export function test_physical_support_endpoints(): void {
  const profile: P = PhysicalModelFixtures.stickman().profile;
  const targets: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map(
      (segment: (typeof profile.segments)[number]): [string, P.ITransform] => [
        segment.bone,
        segment.neutral,
      ],
    ),
  );
  const pattern: IAutoMovieFootfallPattern = {
    id: "actual-stickman-shin-tips",
    minimumSupports: 1,
    limbs: (["left", "right"] as const).map(
      (
        side: "left" | "right",
        index: number,
      ): {
        bone: string;
        localPoint: IAutoMovieVector3;
        chain: string[];
        phase: number;
        duty: number;
        offset: { forward: number; left: number };
        stride: { speed: number; length: number }[];
      } => {
        const segment: P.ISegment = profile.segments.find(
          (candidate: (typeof profile.segments)[number]): boolean =>
            candidate.bone === `${side}LowerLeg`,
        )!;
        const shape: P.IShape = segment.shapes[0]!;
        if (shape.kind !== "capsule")
          throw new Error(
            "Existing stickman shin must retain its actual capsule",
          );
        const localPoint: IAutoMovieVector3 = Vector3.add(
          shape.transform.position,
          Quaternion.rotateVector(shape.transform.rotation, {
            x: 0,
            y: -shape.halfLength - shape.radius,
            z: 0,
          }),
        );
        return {
          bone: segment.bone,
          localPoint,
          chain: [`${side}UpperLeg`, segment.bone],
          phase: index / 2,
          duty: 0.6,
          offset: { forward: 0, left: segment.neutral.position.x },
          stride: [{ speed: 0, length: 0.4 }],
        };
      },
    ),
  };
  const moving: (typeof pattern.limbs)[number] = pattern.limbs[0]!;
  const original: IAutoMovieVector3 = physicalSupportPoint(
    targets[moving.bone]!,
    moving.localPoint,
  );
  const goal: IAutoMovieVector3 = { ...original, z: original.z + 0.18 };
  const result: ReturnType<typeof planPhysicalSupportTargets> =
    planPhysicalSupportTargets({
      profile,
      pattern,
      targets,
      goals: { [moving.bone]: goal },
      maximumRootDrop: 0.15,
      iterations: 64,
      tolerance: 0.0001,
    });
  const findings: string[] = [];
  if (!(result.rootDrop > 0 && result.rootDrop < 0.15))
    findings.push(`reach lowering ${result.rootDrop}`);
  for (const limb of pattern.limbs) {
    const expected: IAutoMovieVector3 =
      limb === moving
        ? goal
        : physicalSupportPoint(targets[limb.bone]!, limb.localPoint);
    const error: number = Vector3.length(
      Vector3.subtract(
        physicalSupportPoint(result.targets[limb.bone]!, limb.localPoint),
        expected,
      ),
    );
    if (error > 0.005) findings.push(`${limb.bone} endpoint ${error}`);
  }
  for (const joint of profile.joints) {
    const a: IAutoMovieVector3 = physicalSupportPoint(
      result.targets[joint.parent]!,
      joint.parentFrame.position,
    );
    const b: IAutoMovieVector3 = physicalSupportPoint(
      result.targets[joint.child]!,
      joint.childFrame.position,
    );
    if (Vector3.length(Vector3.subtract(a, b)) > 1e-10)
      findings.push(`${joint.id} separated anchors`);
  }
  TestValidator.equals(
    "actual distal points and unchanged articulated anchors",
    findings,
    [],
  );
}
