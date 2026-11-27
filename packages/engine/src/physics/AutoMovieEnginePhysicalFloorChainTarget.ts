import type {
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalArticulationTargets,
  IAutoMovieSolvePhysicalFloorChainTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalShapeBoundsImplementation } from "./internal/physicalShapeBoundsImplementation";
import { physicalSupportPoint } from "./internal/physicalSupportPoint";
import { solvePhysicalArticulationTargets } from "./internal/solvePhysicalArticulationTargets";

/** Physical floor-chain target fitting. */
export namespace AutoMovieEnginePhysicalFloorChainTarget {
  /**
   * Fit endpoint goals and their floor constraints together using bounded native
   * joint coordinates. The residual retains unresolved endpoint and floor
   * errors.
   */
  export function solve(
    input: IAutoMovieSolvePhysicalFloorChainTarget.IInput,
  ): IAutoMovieSolvePhysicalArticulationTargets.IResult {
    return solvePhysicalFloorChainTargetImplementation(input);
  }
}

function solvePhysicalFloorChainTargetImplementation(
  input: IAutoMovieSolvePhysicalFloorChainTarget.IInput,
): IAutoMovieSolvePhysicalArticulationTargets.IResult {
  if (
    input.iterations < 1 ||
    input.iterations > 64 ||
    input.tolerance <= 0 ||
    input.chain.length < 2 ||
    !input.contacts.length
  )
    throw new Error("Invalid physical floor-chain target");
  if (
    (input.endpointBone !== undefined &&
      !input.chain.includes(input.endpointBone)) ||
    (input.floorPoints !== undefined &&
      (input.floorPoints.length > 64 ||
        input.floorPoints.some(
          (point: { bone: string; localPoint: IAutoMovieVector3 }): boolean =>
            !input.contacts.includes(point.bone),
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

  /*
   * The nonlinear height witness follows the same complete convex patch as
   * contact.
   */
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
            physicalShapeBoundsImplementation.physicalShapeBounds(poses[bone]!, shape).min.y,
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
