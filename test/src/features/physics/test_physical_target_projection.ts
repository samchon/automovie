import {
  Quaternion,
  Vector3,
  measurePhysicalJointLimits,
  physicalShapeBounds,
  planPhysicalFloorSupportTargets,
  projectPhysicalTargets,
  solvePhysicalChainTarget,
  solvePhysicalFloorChainTarget,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/** Native-coordinate target admission and geometry-derived support height.
 *
 * Scenarios:
 * 1. Combined rotations and separated authored anchors become an admitted tree.
 * 2. Multi-axis endpoint fitting preserves every free and locked coordinate.
 * 3. Two independent sole patches pitched up and four pitched down land at their actual box surfaces.
 * 4. An unreachable endpoint retains a large residual and the root-drop budget.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Quaternion`, `Vector3`, `measurePhysicalJointLimits` on in-memory inputs and asserts the returned observations through 5x TestValidator.predicate, 2x TestValidator.equals; 4 numbered scenarios (first: Combined rotations and separated authored anchors become an admitted tree.; last: An unreachable endpoint retains a large residual and the root-drop budget.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (5 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: Combined rotations and separated authored anchors become an admitted tree.; last: An unreachable endpoint retains a large residual and the root-drop budget.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_target_projection`, which owns the cases delegated to `PhysicalModelFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Combined rotations and separated authored anchors become an admitted tree.).
 */
export function test_physical_target_projection(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const authored: Record<string, P.ITransform> = Object.fromEntries(
    profile.segments.map((segment: P.ISegment): [string, P.ITransform] => [
      segment.bone,
      structuredClone(segment.neutral),
    ]),
  );
  authored["upper-0"]!.rotation = Quaternion.multiply(
    Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 80),
    Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 60),
  );
  authored["upper-0"]!.position.x += 0.1;
  const before: string = JSON.stringify(authored);
  const projection: ReturnType<typeof projectPhysicalTargets> =
    projectPhysicalTargets(profile, authored);
  TestValidator.predicate(
    "physical approximation remains observable",
    projection.maximumTranslation > 0.05 && projection.maximumRotation > 0.01,
  );
  inspect(projection.targets);
  const fit: ReturnType<typeof solvePhysicalChainTarget> =
    solvePhysicalChainTarget({
      profile,
      chain: ["upper-0", "lower-0", "support-0"],
      targets: projection.targets,
      goal: { x: 0.45, y: 0.08, z: 0.4 },
      iterations: 48,
      tolerance: 0.0001,
    });
  inspect(fit.targets);
  TestValidator.equals(
    "borrowed authored placements unchanged",
    JSON.stringify(authored),
    before,
  );

  // Each count lands from one pitch sign; the planner treats limbs alike, so
  // the remaining count and pitch pairs repeat the same decisions.
  for (const [count, pitch] of [
    [2, 35],
    [4, -25],
  ] as const) {
    const initial: Record<string, P.ITransform> = Object.fromEntries(
      profile.segments.map((segment: P.ISegment): [string, P.ITransform] => [
        segment.bone,
        {
          position: {
            ...segment.neutral.position,
            y: segment.neutral.position.y + 0.08,
          },
          rotation: segment.bone.startsWith("support-")
            ? Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, pitch)
            : { ...segment.neutral.rotation },
        },
      ]),
    );
    const targets: Record<string, P.ITransform> = projectPhysicalTargets(
      profile,
      initial,
    ).targets;
    const pattern: IAutoMovieFootfallPattern = {
      id: "independent-box-patches",
      minimumSupports: 1,
      limbs: Array.from(
        { length: count },
        (
          _: unknown,
          index: number,
        ): IAutoMovieFootfallPattern["limbs"][number] => ({
          bone: `support-${index}`,
          chain: [`upper-${index}`, `lower-${index}`, `support-${index}`],
          contacts: [`support-${index}`],
          phase: index / count,
          duty: 0.5,
          offset: { forward: 0, left: 0 },
          stride: [{ speed: 0, length: 0.5 }],
        }),
      ),
    };
    for (const limb of pattern.limbs) {
      const shape: P.IShape = profile.segments.find(
        (segment: P.ISegment): boolean => segment.bone === limb.bone,
      )!.shapes[0]!;
      if (shape.kind !== "box")
        throw new Error("Expected independent primitive box");
      limb.floorPoints = [-1, 1].flatMap(
        (x: number): NonNullable<typeof limb.floorPoints> =>
          [-1, 1].map(
            (z: number): NonNullable<typeof limb.floorPoints>[number] => ({
              bone: limb.bone,
              localPoint: {
                x: x * shape.halfExtents.x,
                y: -shape.halfExtents.y,
                z: z * shape.halfExtents.z,
              },
            }),
          ),
      );
    }
    const goals: Record<string, IAutoMovieVector3> = Object.fromEntries(
      pattern.limbs.map(
        (
          limb: IAutoMovieFootfallPattern["limbs"][number],
        ): [string, IAutoMovieVector3] => [
          limb.bone,
          {
            ...targets[limb.bone]!.position,
            x: targets[limb.bone]!.position.x + 0.06,
          },
        ],
      ),
    );
    const result: ReturnType<typeof planPhysicalFloorSupportTargets> =
      planPhysicalFloorSupportTargets({
        profile,
        targets,
        pattern,
        goals,
        planted: pattern.limbs.map(
          (limb: IAutoMovieFootfallPattern["limbs"][number]): string =>
            limb.bone,
        ),
        floor: 0,
        maximumRootDrop: 0.2,
        passes: 12,
        iterations: 48,
        tolerance: 0.0001,
      });
    inspect(result.targets);
    for (const limb of pattern.limbs) {
      const segment: P.ISegment = profile.segments.find(
        (candidate: P.ISegment): boolean => candidate.bone === limb.bone,
      )!;
      const minimum: number = Math.min(
        ...segment.shapes.map(
          (shape: P.IShape): number =>
            physicalShapeBounds(result.targets[limb.bone]!, shape).min.y,
        ),
      );
      TestValidator.predicate(
        `${count} supports at ${pitch} degrees: floor and horizontal goal ${limb.bone}`,
        Math.abs(minimum) < 0.002 &&
          Math.abs(
            result.targets[limb.bone]!.position.x - goals[limb.bone]!.x,
          ) < 0.002,
      );
      for (const witness of limb.floorPoints!) {
        const surface: IAutoMovieVector3 = Vector3.add(
          result.targets[limb.bone]!.position,
          Quaternion.rotateVector(
            result.targets[limb.bone]!.rotation,
            witness.localPoint,
          ),
        );
        TestValidator.predicate(
          "the complete planted face reaches its plane",
          Math.abs(surface.y) < 0.002,
        );
      }
    }
    // Unreachable and free endpoints are count-independent; read them once.
    if (count !== 4) continue;
    const unreachable: ReturnType<typeof planPhysicalFloorSupportTargets> =
      planPhysicalFloorSupportTargets({
        profile,
        targets,
        pattern,
        goals: { ...goals, "support-0": { x: 100, y: 0.05, z: 0 } },
        planted: ["support-0"],
        floor: 0,
        maximumRootDrop: 0.05,
        passes: 2,
        iterations: 12,
        tolerance: 0.0001,
      });
    TestValidator.predicate(
      "unreachable intent stays explicit",
      unreachable.residuals["support-0"]! > 90 && unreachable.rootDrop <= 0.05,
    );
    const free: ReturnType<typeof solvePhysicalFloorChainTarget> =
      solvePhysicalFloorChainTarget({
        profile,
        targets,
        chain: pattern.limbs[0]!.chain,
        contacts: ["support-0"],
        goal: { x: 0.4, y: 0.2, z: 0.3 },
        endpointHeight: 0.2,
        floor: 0,
        iterations: 48,
        tolerance: 0.0001,
      });
    inspect(free.targets);
    TestValidator.predicate(
      "free endpoint height and physical floor are jointly fitted",
      free.residual < 0.002,
    );
  }

  /** Independently measure all anchors and native coordinates after each operation. */
  function inspect(targets: Record<string, P.ITransform>): void {
    const failures: string[] = [];
    for (const joint of profile.joints) {
      const parent: P.ITransform = targets[joint.parent]!;
      const child: P.ITransform = targets[joint.child]!;
      const a: IAutoMovieVector3 = Vector3.add(
        parent.position,
        Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
      );
      const b: IAutoMovieVector3 = Vector3.add(
        child.position,
        Quaternion.rotateVector(child.rotation, joint.childFrame.position),
      );
      if (Vector3.length(Vector3.subtract(a, b)) > 1e-10)
        failures.push(`${joint.id}: anchor`);
      if (
        measurePhysicalJointLimits(joint, parent, child).some(
          (
            coordinate: ReturnType<typeof measurePhysicalJointLimits>[number],
          ): boolean => coordinate.violation > 1e-10,
        )
      )
        failures.push(`${joint.id}: angular coordinates`);
    }
    TestValidator.equals("admitted full tree", failures, []);
  }
}
