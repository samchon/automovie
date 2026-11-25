import {
  Quaternion,
  Vector3,
  planPhysicalBalanceTargets,
  planPhysicalContactTargets,
  planPhysicalFloorSupportTargets,
  preparePhysicalGeometry,
  setPhysicalTargetJointRotation,
} from "@automovie/engine";
import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalContactSupportRows,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalPointBound,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePreparePhysicalGeometry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../../../internal/PhysicalSupportFixtures";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Independent placement of every carrier in one fitted candidate. */
type Poses = Record<string, IAutoMovieRigidTransform>;

/**
 * Planted geometry stays on its declared plane through floor and contact
 * fitting.
 *
 * Scenarios:
 *
 * 1. Independent supports tilted 6° and −5° lift a sole edge by 10 mm or more, far
 *    outside the 0.2 mm display bound. Floor fitting returns them to an
 *    explicitly feasible flat pose within its tolerance. Re-tilted −5° and 6°,
 *    the contact fit restores the original world goals and both whole patches
 *    while an additional point relationship is active.
 * 2. An impossible external projection retains its measured distance to the
 *    allowed value instead of claiming the relationship was satisfied.
 * 3. An elevated point that already matches its XYZ goal still has to meet the
 *    declared planted floor or report the outstanding floor error.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives each test case and its expected result, including the distinction between XYZ and a planted surface.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises both public fit stages on tilted box patches and checks their final world geometry, then checks unreachable and elevated-contact outputs.
 * @evidence contracts/development/testing.md#independent-expectations Derives complete box bounds from transformed corners and directly computes the point projection and endpoint error. Uses #3095's 0.2 mm displayed tolerance and checks the unresolved norm against its measured endpoint and floor components. Tilts are degrees, as `Quaternion.fromAxisAngle` takes them. Each unfitted stage must breach the bound tenfold, so an implementation that skips fitting fails.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers feasible flat placement, disturbance through contact fitting, a refused relationship result and an elevated planted endpoint without explicit plane witnesses.
 * @evidence contracts/development/testing.md#execution-ownership The named runner unit borrows in-memory primitive fixtures and uses only Engine's initialized shape-query adapter.
 */
export async function test_unit_engine_physics_plan_physical_balance_targets(): Promise<void> {
  const profile: IAutoMoviePhysicalProfile = PhysicalModelFixtures.quadrupod();
  const body: string = profile.id;
  const plane: number = -0.0001;
  const tolerance: number = 0.000025;
  const displayedTolerance: number = 0.0002;
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const reference: Poses = translated(plane);
  const pattern: IAutoMovieFootfallPattern = structuredClone(
    PhysicalSupportFixtures.body(profile, 0).balance!.pattern,
  );
  pattern.limbs = pattern.limbs.slice(0, 2);
  const planted: string[] = pattern.limbs.map(
    (limb: IAutoMovieFootfallPattern["limbs"][number]): string => limb.bone,
  );
  for (const limb of pattern.limbs)
    limb.floorPoints = corners(limb.bone, true).map(
      (
        localPoint: IAutoMovieVector3,
      ): { bone: string; localPoint: IAutoMovieVector3 } => ({
        bone: limb.bone,
        localPoint,
      }),
    );
  const goals: Record<string, IAutoMovieVector3> = Object.fromEntries(
    planted.map((bone: string): [string, IAutoMovieVector3] => [
      bone,
      structuredClone(reference[bone]!.position),
    ]),
  );
  const floorTargets: Poses = structuredClone(reference);
  tilt(floorTargets, planted[0]!, 6);
  tilt(floorTargets, planted[1]!, -5);
  const original: string = JSON.stringify({ goals, pattern });
  const fitted: ReturnType<typeof planPhysicalFloorSupportTargets> =
    planPhysicalFloorSupportTargets({
      profile,
      targets: floorTargets,
      pattern,
      goals,
      planted,
      endpointHeights: Object.fromEntries(
        planted.map((bone: string): [string, number] => [bone, goals[bone]!.y]),
      ),
      floor: plane,
      maximumRootDrop: 0,
      passes: 4,
      iterations: 48,
      tolerance,
    });

  const geometry: IAutoMoviePreparePhysicalGeometry.IQueries =
    await preparePhysicalGeometry();
  const contactTargets: Poses = structuredClone(fitted.targets);
  tilt(contactTargets, planted[0]!, -5);
  tilt(contactTargets, planted[1]!, 6);
  const supports: IAutoMoviePhysicalContactSupportRows.ISupport[] =
    pattern.limbs.map(
      (
        limb: IAutoMovieFootfallPattern["limbs"][number],
      ): IAutoMoviePhysicalContactSupportRows.ISupport => ({
        bone: limb.bone,
        point: goals[limb.bone]!,
        patch: {
          contacts: limb.contacts!,
          floorPoints: limb.floorPoints!,
          floor: plane,
        },
      }),
    );
  const bounds: IAutoMoviePhysicalPointBound[] = pattern.limbs.map(
    (
      limb: IAutoMovieFootfallPattern["limbs"][number],
    ): IAutoMoviePhysicalPointBound => {
      const displacement: number =
        goals[limb.bone]!.x - reference.body!.position.x;
      return {
        id: `position-${limb.bone}`,
        chain: limb.chain,
        source: { bone: limb.bone, localPoint: zero },
        reference: { body, bone: "body", localPoint: zero },
        axis: { x: 1, y: 0, z: 0 },
        minimum: displacement,
        maximum: displacement,
        iterations: 32,
        tolerance,
      };
    },
  );
  const contacted: ReturnType<typeof planPhysicalContactTargets> =
    contact(bounds);
  const invalid: IAutoMoviePhysicalPointBound = {
    ...bounds[0]!,
    minimum: bounds[0]!.minimum! + 2,
    maximum: undefined,
  };
  const missed: ReturnType<typeof planPhysicalContactTargets> = contact([
    invalid,
  ]);

  const elevated: Poses = translated(0.0004);
  const limb: IAutoMovieFootfallPattern["limbs"][number] = pattern.limbs[0]!;
  const elevatedGoal: IAutoMovieVector3 = { ...elevated[limb.bone]!.position };
  const elevatedFit: ReturnType<typeof planPhysicalBalanceTargets> =
    planPhysicalBalanceTargets({
      profile,
      pattern: {
        ...pattern,
        limbs: [{ ...limb, floorPoints: undefined }],
      },
      targets: elevated,
      root: { bone: "body", pose: elevated.body! },
      goals: { [limb.bone]: { ...elevatedGoal } },
      planted: [limb.bone],
      floor: 0,
      maximumRootDrop: 0,
      iterations: 12,
      tolerance,
    });

  const findings: string[] = [];
  const observations: {
    stage: string;
    bone: string;
    gap: number;
    face: number;
    endpointError: number;
  }[] = [];
  disturbed("floor input", floorTargets);
  disturbed("contact input", contactTargets);
  verify("floor", fitted.targets);
  verify("contact", contacted.targets);
  for (const bone of planted)
    if (!(fitted.residuals[bone]! <= tolerance))
      findings.push(`floor/${bone}: fit residual ${fitted.residuals[bone]}`);
  for (const bound of bounds)
    if (!nclose(contacted.residuals[bound.id]!, 0, displayedTolerance))
      findings.push(
        `${bound.id}: contact residual ${contacted.residuals[bound.id]}`,
      );
  const unmet: number =
    invalid.minimum! -
    (missed.targets[invalid.source.bone]!.position.x -
      reference.body!.position.x);
  if (unmet < 0.5 || !nclose(missed.residuals[invalid.id]!, unmet, tolerance))
    findings.push(
      `impossible projection: distance ${unmet}, residual ${missed.residuals[invalid.id]}`,
    );
  const gap: number = minimum(elevatedFit.targets, limb.bone);
  const residual: number = elevatedFit.residuals[limb.bone]!;
  const endpointError: number = Vector3.length(
    Vector3.subtract(elevatedFit.targets[limb.bone]!.position, elevatedGoal),
  );
  const expectedResidual: number = Math.hypot(endpointError, gap);
  if (
    !nclose(gap, 0, displayedTolerance) &&
    !nclose(residual, expectedResidual, tolerance)
  )
    findings.push(
      `elevated planted patch: signed floor gap ${gap}, XYZ error ${endpointError}, residual ${residual}, expected ${expectedResidual}`,
    );
  if (JSON.stringify({ goals, pattern }) !== original)
    findings.push("original goals or patches mutated");
  TestValidator.equals(
    `floor and contact handoff observations ${JSON.stringify(observations)}`,
    findings,
    [],
  );

  /** Forward a prepared pose without rebinding the original support goals. */
  function contact(
    pointBounds: readonly IAutoMoviePhysicalPointBound[],
  ): ReturnType<typeof planPhysicalContactTargets> {
    return planPhysicalContactTargets({
      body,
      profiles: { [body]: profile },
      targets: contactTargets,
      actual: { [body]: reference },
      bindings: [],
      pointBounds,
      supports,
      geometry,
      floor: plane,
    });
  }

  /** Place a complete known flat configuration at a world height. */
  function translated(height: number): Poses {
    return Object.fromEntries(
      profile.segments.map(
        (
          segment: IAutoMoviePhysicalSegment,
        ): [string, IAutoMovieRigidTransform] => [
          segment.bone,
          {
            position: {
              ...segment.neutral.position,
              y: segment.neutral.position.y + height,
            },
            rotation: { ...segment.neutral.rotation },
          },
        ],
      ),
    );
  }

  /**
   * Require each planted sole of an unfitted stage to break the displayed
   * bound, so passing needs the fit.
   */
  function disturbed(stage: string, poses: Poses): void {
    for (const bone of planted) {
      const pose: IAutoMovieRigidTransform = poses[bone]!;
      const lift: number = Math.max(
        ...corners(bone, true).map((point: IAutoMovieVector3): number =>
          Math.abs(
            pose.position.y +
              Quaternion.rotateVector(pose.rotation, point).y -
              plane,
          ),
        ),
      );
      if (lift <= 10 * displayedTolerance)
        findings.push(
          `${stage}/${bone}: disturbance ${lift} stays within the displayed bound`,
        );
    }
  }

  /**
   * Tilt only one support about its admitted joint anchor by an angle in
   * degrees.
   */
  function tilt(poses: Poses, bone: string, angle: number): void {
    const joint: IAutoMoviePhysicalJoint = profile.joints.find(
      (candidate: IAutoMoviePhysicalJoint): boolean => candidate.child === bone,
    )!;
    setPhysicalTargetJointRotation(
      poses,
      joint,
      [bone],
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, angle),
    );
  }

  /**
   * Evaluate exact box corners in the carrier frame independently of floor
   * fitting.
   */
  function corners(bone: string, undersideOnly: boolean): IAutoMovieVector3[] {
    const shape: IAutoMoviePhysicalShape = profile.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === bone,
    )!.shapes[0]!;
    if (shape.kind !== "box") throw new Error("Expected independent box");
    const points: IAutoMovieVector3[] = [];
    for (const x of [-1, 1])
      for (const y of undersideOnly ? [-1] : [-1, 1])
        for (const z of [-1, 1])
          points.push(
            Vector3.add(
              shape.transform.position,
              Quaternion.rotateVector(shape.transform.rotation, {
                x: x * shape.halfExtents.x,
                y: y * shape.halfExtents.y,
                z: z * shape.halfExtents.z,
              }),
            ),
          );
    return points;
  }

  /**
   * Measure the whole displayed box against floor zero, including its signed
   * gap.
   */
  function minimum(poses: Poses, bone: string): number {
    const pose: IAutoMovieRigidTransform = poses[bone]!;
    return Math.min(
      ...corners(bone, false).map(
        (point: IAutoMovieVector3): number =>
          pose.position.y + Quaternion.rotateVector(pose.rotation, point).y,
      ),
    );
  }

  /**
   * Check the original XYZ point, complete plane and signed display gap
   * together.
   */
  function verify(stage: string, poses: Poses): void {
    for (const bone of planted) {
      const pose: IAutoMovieRigidTransform = poses[bone]!;
      const gap: number = minimum(poses, bone);
      const face: number = Math.max(
        ...corners(bone, true).map((point: IAutoMovieVector3): number =>
          Math.abs(
            pose.position.y +
              Quaternion.rotateVector(pose.rotation, point).y -
              plane,
          ),
        ),
      );
      observations.push({
        stage,
        bone,
        gap,
        face,
        endpointError: Vector3.length(
          Vector3.subtract(pose.position, goals[bone]!),
        ),
      });
      if (
        !nclose(gap, 0, displayedTolerance) ||
        face > tolerance ||
        !vclose(pose.position, goals[bone]!, displayedTolerance)
      )
        findings.push(
          `${stage}/${bone}: signed floor gap ${gap}, face error ${face}, endpoint ${JSON.stringify(pose.position)}`,
        );
    }
  }
}
