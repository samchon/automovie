import {
  Quaternion,
  Vector3,
  solvePhysicalFloorChainTarget,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalFloorChainTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalModelFixtures } from "../../internal/PhysicalModelFixtures";
import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * A floor-chain fit converges when it can and otherwise reports its true
 * residual.
 *
 * Scenarios:
 *
 * 1. A planted sole on a raised plane with a horizontal goal inside the leg's
 *    reach meets the endpoint, every sole witness and the 0.2 mm display
 *    bound.
 * 2. The same sole with a goal beyond the leg's reach stops short and returns a
 *    residual above tolerance that equals the error measured at its pose.
 * 3. A one-iteration budget on the feasible goal is still reported at the error of
 *    the pose it returns and is never better than the full budget.
 * 4. A planted patch without witnesses asked for an endpoint height the box cannot
 *    reach while touching reports its hover gap. A non-planted patch with the
 *    same request treats the plane only as a lower bound.
 */
export function test_engine_physics_solve_physical_floor_chain_target(): void {
  const profile: IAutoMoviePhysicalProfile = PhysicalModelFixtures.quadrupod();
  const chain: string[] = ["upper-0", "lower-0", "support-0"];
  const sole: string = "support-0";
  const shape: IAutoMoviePhysicalShape = profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === sole,
  )!.shapes[0]!;
  if (shape.kind !== "box") throw new Error("Expected independent box sole");
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
  const plane: number = 0.02;
  const tolerance: number = 0.000025;
  const displayed: number = 0.0002;
  // The hip from the fixture's own joint anchor on the body: the legs' bent
  // knees lower it below 1 m.
  const body: IAutoMoviePhysicalSegment = profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === "body",
  )!;
  const hip: IAutoMovieVector3 = Vector3.add(
    body.neutral.position,
    Quaternion.rotateVector(
      body.neutral.rotation,
      profile.joints.find((joint): boolean => joint.child === "upper-0")!
        .parentFrame.position,
    ),
  );
  const witnesses: IAutoMovieSolvePhysicalFloorChainTarget.IInput["floorPoints"] =
    corners(true).map(
      (
        localPoint: IAutoMovieVector3,
      ): { bone: string; localPoint: IAutoMovieVector3 } => ({
        bone: sole,
        localPoint,
      }),
    );
  const findings: string[] = [];

  const reach: number = Math.sqrt(0.9 ** 2 - (hip.y - (plane + 0.1)) ** 2);
  const feasible: IAutoMovieVector3 = { x: hip.x + 0.06, y: 0, z: hip.z };
  const converged: number = check("feasible", {
    goal: feasible,
    floorPoints: witnesses,
    iterations: 48,
  });
  if (converged > tolerance)
    findings.push(`feasible: residual ${converged} above tolerance`);
  const beyond: number = check("unreachable", {
    goal: { x: hip.x + reach + 0.06, y: 0, z: hip.z },
    floorPoints: witnesses,
    iterations: 48,
  });
  if (!(beyond > tolerance))
    findings.push(`unreachable: residual ${beyond} claims convergence`);
  const bounded: number = check("one-iteration", {
    goal: feasible,
    floorPoints: witnesses,
    iterations: 1,
  });
  if (bounded < converged)
    findings.push(`one-iteration: residual ${bounded} below full ${converged}`);

  // The sole's half-diagonal (0.13 m) caps the centre height of a touching box.
  const lifted: number = plane + 0.2;
  const hovering: number = check("planted-hover", {
    goal: { ...feasible },
    endpointHeight: lifted,
    fitPatchMinimum: true,
    iterations: 48,
  });
  if (!(hovering > tolerance))
    findings.push(`planted-hover: residual ${hovering} hides the gap`);
  const free: number = check("free-hover", {
    goal: { ...feasible },
    endpointHeight: lifted,
    iterations: 48,
  });
  if (free > tolerance)
    findings.push(`free-hover: residual ${free} for a reachable free height`);
  TestValidator.equals("honest floor-chain residuals", findings, []);

  /** Fit one case and compare its residual with an independent measurement. */
  function check(
    label: string,
    options: Pick<
      IAutoMovieSolvePhysicalFloorChainTarget.IInput,
      | "goal"
      | "floorPoints"
      | "endpointHeight"
      | "fitPatchMinimum"
      | "iterations"
    >,
  ): number {
    const result: ReturnType<typeof solvePhysicalFloorChainTarget> =
      solvePhysicalFloorChainTarget({
        profile,
        targets,
        chain,
        contacts: [sole],
        floor: plane,
        tolerance,
        ...options,
      });
    const pose: IAutoMovieRigidTransform = result.targets[sole]!;
    const world: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(pose.position, Quaternion.rotateVector(pose.rotation, point));
    const gap: number =
      Math.min(
        ...corners(false).map(
          (point: IAutoMovieVector3): number => world(point).y,
        ),
      ) - plane;
    const witnessRows: number[] = (options.floorPoints ?? []).map(
      (point: { localPoint: IAutoMovieVector3 }): number =>
        world(point.localPoint).y - plane,
    );
    const lowerBound: boolean =
      witnessRows.length > 0 ||
      (options.endpointHeight !== undefined &&
        options.fitPatchMinimum !== true);
    const rows: number[] = [
      pose.position.x - options.goal.x,
      pose.position.z - options.goal.z,
      ...(options.endpointHeight === undefined
        ? []
        : [pose.position.y - options.endpointHeight]),
      ...witnessRows,
      lowerBound ? Math.min(0, gap) : gap,
    ];
    const measured: number = Math.hypot(...rows);
    if (
      !(
        Math.abs(result.residual - measured) <=
        PhysicalTolerance.ACCUMULATED * Math.max(1, measured)
      )
    )
      findings.push(
        `${label}: residual ${result.residual}, measured ${measured} from ${JSON.stringify(rows)}`,
      );
    if (
      measured <= tolerance &&
      (Math.abs(rows[0]!) > displayed ||
        Math.abs(rows[1]!) > displayed ||
        gap < -displayed ||
        (!lowerBound && gap > displayed))
    )
      findings.push(
        `${label}: converged residual with displayed error ${JSON.stringify(rows)}`,
      );
    return result.residual;
  }

  /** Box corners in the sole's carrier frame, from its declared shape. */
  function corners(undersideOnly: boolean): IAutoMovieVector3[] {
    if (shape.kind !== "box") throw new Error("Expected independent box sole");
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
}
