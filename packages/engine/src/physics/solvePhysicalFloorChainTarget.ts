import type {
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalArticulationTargets,
  IAutoMovieSolvePhysicalFloorChainTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { solvePhysicalArticulationTargets } from "./solvePhysicalArticulationTargets";

/**
 * Fit endpoint goals and their floor constraints together using bounded native
 * joint coordinates. The residual retains unresolved endpoint and floor errors.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fitted quantities, bounded native coordinates and reported residual.
 * @evidence contracts/development/implementation.md#principled-implementation Measures the actual convex patch minimum. Explicit witnesses keep a nonpenetration row, and planted patches without witnesses retain signed clearance beside endpoint height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Selects the floor constraint once and shares one measurement between the nonlinear residual and its linearization.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses admitted carrier geometry and endpoint goals directly; invalid options or missing geometry are rejected.
 * @evidence contracts/development/implementation.md#efficient-algorithms Reuses the same bounded articulation solve and calculates patch clearance once per row evaluation.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Measures and solves the current chain using invocation-local state.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Borrows transforms and geometry for the current solve and acquires no resource requiring disposal.
 */
export function solvePhysicalFloorChainTarget(
  input: IAutoMovieSolvePhysicalFloorChainTarget.IInput,
): IAutoMovieSolvePhysicalArticulationTargets.IResult {
  if (
    !Number.isSafeInteger(input.iterations) ||
    input.iterations < 1 ||
    input.iterations > 64 ||
    !(input.tolerance > 0) ||
    !Number.isFinite(input.tolerance) ||
    ![input.goal.x, input.goal.z, input.floor].every(Number.isFinite) ||
    input.chain.length < 2 ||
    !input.contacts.length
  )
    throw new Error("Invalid physical floor-chain target");
  if (
    (input.endpointHeight !== undefined &&
      !Number.isFinite(input.endpointHeight)) ||
    (input.fitPatchMinimum !== undefined &&
      typeof input.fitPatchMinimum !== "boolean") ||
    (input.endpointBone !== undefined &&
      !input.chain.includes(input.endpointBone)) ||
    (input.floorPoints !== undefined &&
      (!Array.isArray(input.floorPoints) ||
        input.floorPoints.length > 64 ||
        input.floorPoints.some(
          (point: { bone: string; localPoint: IAutoMovieVector3 }): boolean =>
            !point ||
            !input.contacts.includes(point.bone) ||
            !point.localPoint ||
            ![point.localPoint.x, point.localPoint.y, point.localPoint.z].every(
              Number.isFinite,
            ),
        )))
  )
    throw new Error("Invalid physical support-plane or endpoint witness");
  const floorPoints: NonNullable<
    IAutoMovieSolvePhysicalFloorChainTarget.IInput["floorPoints"]
  > = input.floorPoints ?? [];
  const floorLowerBound: boolean =
    floorPoints.length > 0 ||
    (input.endpointHeight !== undefined && input.fitPatchMinimum !== true);
  return solvePhysicalArticulationTargets({
    profile: input.profile,
    bones: input.chain,
    targets: input.targets,
    iterations: input.iterations,
    tolerance: input.tolerance,
    measure,
    linearize: (
      poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    ): ((
      probe: Readonly<Record<string, IAutoMovieRigidTransform>>,
    ) => number[]) => {
      const active: boolean | undefined = floorLowerBound
        ? measure(poses).at(-1)! < 0
        : undefined;
      return (
        probe: Readonly<Record<string, IAutoMovieRigidTransform>>,
      ): number[] => measure(probe, active);
    },
  });

  /** The nonlinear height witness follows the same complete convex patch as contact. */
  function measure(
    poses: Readonly<Record<string, IAutoMovieRigidTransform>>,
    activeFloor?: boolean,
  ): number[] {
    const endpoint: IAutoMovieVector3 = physicalSupportPoint(
      poses[(input.endpointBone ?? input.chain.at(-1))!]!,
      input.localPoint,
    );
    const heights: number[] = input.contacts.flatMap(
      (bone: string): number[] => {
        const segment: IAutoMoviePhysicalSegment | undefined =
          input.profile.segments.find(
            (candidate: IAutoMoviePhysicalSegment): boolean =>
              candidate.bone === bone,
          );
        if (!segment || !poses[bone])
          throw new Error(`Missing floor-chain patch ${bone}`);
        return segment.shapes.map(
          (shape: IAutoMoviePhysicalShape): number =>
            physicalShapeBounds(poses[bone]!, shape).min.y,
        );
      },
    );
    if (!heights.length) throw new Error("Empty physical floor-chain patch");
    const clearance: number = Math.min(...heights) - input.floor;
    const floor: number =
      !floorLowerBound || activeFloor === true
        ? clearance
        : activeFloor === false
          ? 0
          : Math.min(0, clearance);
    const rows: number[] = [
      endpoint.x - input.goal.x,
      endpoint.z - input.goal.z,
    ];
    if (input.endpointHeight !== undefined)
      rows.push(endpoint.y - input.endpointHeight);
    for (const point of floorPoints)
      rows.push(
        physicalSupportPoint(poses[point.bone]!, point.localPoint).y -
          input.floor,
      );
    rows.push(floor);
    return rows;
  }
}
