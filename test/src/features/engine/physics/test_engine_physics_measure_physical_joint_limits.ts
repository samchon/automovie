import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysicalFloorChainTarget, AutoMovieEnginePhysics, AutoMovieEnginePhysicalSimulation } from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * Native-coordinate target admission and geometry-derived support height.
 *
 * Scenarios:
 *
 * 1. Combined rotations and separated authored anchors become an admitted tree.
 * 2. Multi-axis endpoint fitting preserves every free and locked coordinate.
 * 3. Two independent sole patches pitched up and four pitched down land at their
 *    actual box surfaces.
 * 4. An unreachable endpoint retains a large residual and the root-drop budget.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes coordinated native fitting of joint limits, separated anchors and sole height, including observable infeasibility.
 * @evidence contracts/development/testing.md#behavioral-verification Fits articulated trees and pitched sole patches under multiple constraints and checks actual floor contacts and the unreachable case.
 * @evidence contracts/development/testing.md#independent-expectations Fixed pitch, box surfaces and locked axes provide independent expectations. The unreachable endpoint retains a large residual while staying inside the root-drop budget.
 */
export function test_engine_physics_measure_physical_joint_limits(): void {
  const profile: P = PhysicalModelFixtures.quadrupod();
  const authored: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    profile.segments.map(
      (
        segment: IAutoMoviePhysicalSegment,
      ): [string, IAutoMovieRigidTransform] => [
        segment.bone,
        structuredClone(segment.neutral),
      ],
    ),
  );
  authored["upper-0"]!.rotation = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 80),
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 60),
  );
  authored["upper-0"]!.position.x += 0.1;
  const before: string = JSON.stringify(authored);
  const projection: ReturnType<typeof AutoMovieEnginePhysicalSimulation.projectTargets> =
    AutoMovieEnginePhysicalSimulation.projectTargets(profile, authored);
  TestValidator.predicate(
    "physical approximation remains observable",
    projection.maximumTranslation > 0.05 && projection.maximumRotation > 0.01,
  );
  inspect(projection.targets);
  const fit: ReturnType<typeof AutoMovieEnginePhysics.solvePhysicalChainTarget> =
    AutoMovieEnginePhysics.solvePhysicalChainTarget({
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
    const initial: Record<string, IAutoMovieRigidTransform> =
      Object.fromEntries(
        profile.segments.map(
          (
            segment: IAutoMoviePhysicalSegment,
          ): [string, IAutoMovieRigidTransform] => [
            segment.bone,
            {
              position: {
                ...segment.neutral.position,
                y: segment.neutral.position.y + 0.08,
              },
              rotation: segment.bone.startsWith("support-")
                ? AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, pitch)
                : { ...segment.neutral.rotation },
            },
          ],
        ),
      );
    const targets: Record<string, IAutoMovieRigidTransform> =
      AutoMovieEnginePhysicalSimulation.projectTargets(profile, initial).targets;
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
      const shape: IAutoMoviePhysicalShape = profile.segments.find(
        (segment: IAutoMoviePhysicalSegment): boolean =>
          segment.bone === limb.bone,
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
    const result: ReturnType<typeof AutoMovieEnginePhysics.planPhysicalFloorSupportTargets> =
      AutoMovieEnginePhysics.planPhysicalFloorSupportTargets({
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
      const segment: IAutoMoviePhysicalSegment = profile.segments.find(
        (candidate: IAutoMoviePhysicalSegment): boolean =>
          candidate.bone === limb.bone,
      )!;
      const minimum: number = Math.min(
        ...segment.shapes.map(
          (shape: IAutoMoviePhysicalShape): number =>
            AutoMovieEnginePhysics.physicalShapeBounds(result.targets[limb.bone]!, shape).min.y,
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
        const surface: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          result.targets[limb.bone]!.position,
          AutoMovieEngineQuaternion.rotateVector(
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
    const unreachable: ReturnType<typeof AutoMovieEnginePhysics.planPhysicalFloorSupportTargets> =
      AutoMovieEnginePhysics.planPhysicalFloorSupportTargets({
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
    const free: ReturnType<typeof AutoMovieEnginePhysicalFloorChainTarget.solve> =
      AutoMovieEnginePhysicalFloorChainTarget.solve({
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

  /**
   * Independently measure all anchors and native coordinates after each
   * operation.
   */
  function inspect(targets: Record<string, IAutoMovieRigidTransform>): void {
    const failures: string[] = [];
    for (const joint of profile.joints) {
      const parent: IAutoMovieRigidTransform = targets[joint.parent]!;
      const child: IAutoMovieRigidTransform = targets[joint.child]!;
      const a: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        parent.position,
        AutoMovieEngineQuaternion.rotateVector(parent.rotation, joint.parentFrame.position),
      );
      const b: IAutoMovieVector3 = AutoMovieEngineVector3.add(
        child.position,
        AutoMovieEngineQuaternion.rotateVector(child.rotation, joint.childFrame.position),
      );
      if (
        AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(a, b)) > PhysicalTolerance.ACCUMULATED
      )
        failures.push(`${joint.id}: anchor`);
      if (
        AutoMovieEnginePhysics.measurePhysicalJointLimits(joint, parent, child).some(
          (
            coordinate: ReturnType<typeof AutoMovieEnginePhysics.measurePhysicalJointLimits>[number],
          ): boolean => coordinate.violation > PhysicalTolerance.ACCUMULATED,
        )
      )
        failures.push(`${joint.id}: angular coordinates`);
    }
    TestValidator.equals("admitted full tree", failures, []);
  }
}
