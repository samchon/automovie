import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { solvePhysicalArticulationTargets } from "./solvePhysicalArticulationTargets";

/**
 * Fit endpoint X/Z and the actual patch's lowest Y simultaneously. Independent
 * bounded native twist coordinates preserve all locked axes and rigid anchors.
 * Finite-difference Jacobians use the existing original-design SVD; damped
 * steps and backtracking accept only a measured residual decrease. Work is
 * bounded, unreachable intent remains a residual, and no body is teleported.
 */
export function solvePhysicalFloorChainTarget(input: {
  /** Actual fixed-pivot tree. */ profile: P;
  /** Proximal-to-distal joints ending at the support endpoint. */ chain: readonly string[];
  /** Segment owners of the complete support patch. */ contacts: readonly string[];
  /** Admitted working motor goals to copy. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** Requested world endpoint; Y is determined by the patch plane. */ goal: IAutoMovieVector3;
  /** Optional bone-local endpoint. */ localPoint?: IAutoMovieVector3;
  /** Optional endpoint inside the chain; the terminal bone remains the default. */ endpointBone?: string;
  /** Actual surface points which should share the requested plane. */ floorPoints?: readonly {
    bone: string;
    localPoint: IAutoMovieVector3;
  }[];
  /** Fit endpoint Y and treat the floor as a lower bound when supplied. */ endpointHeight?: number;
  /** Requested minimum patch height, metres. */ floor: number;
  /** Positive update budget, at most 64. */ iterations: number;
  /** Positive metre residual early-out. */ tolerance: number;
}): { targets: Record<string, P.ITransform>; residual: number } {
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
  return solvePhysicalArticulationTargets({
    profile: input.profile,
    bones: input.chain,
    targets: input.targets,
    iterations: input.iterations,
    tolerance: input.tolerance,
    measure,
    linearize: (
      poses: Readonly<Record<string, P.ITransform>>,
    ): ((probe: Readonly<Record<string, P.ITransform>>) => number[]) => {
      const residual: number[] = measure(poses);
      const inequality: boolean =
        input.endpointHeight !== undefined || !!input.floorPoints?.length;
      const active: boolean = inequality && residual.at(-1)! < 0;
      return (probe: Readonly<Record<string, P.ITransform>>): number[] =>
        measure(probe, inequality ? active : undefined);
    },
  });

  /** The nonlinear height witness follows the same complete convex patch as contact. */
  function measure(
    poses: Readonly<Record<string, P.ITransform>>,
    activeFloor?: boolean,
  ): number[] {
    const endpoint: IAutoMovieVector3 = physicalSupportPoint(
      poses[(input.endpointBone ?? input.chain.at(-1))!]!,
      input.localPoint,
    );
    const heights: number[] = input.contacts.flatMap(
      (bone: string): number[] => {
        const segment: P.ISegment | undefined = input.profile.segments.find(
          (candidate: P.ISegment): boolean => candidate.bone === bone,
        );
        if (!segment || !poses[bone])
          throw new Error(`Missing floor-chain patch ${bone}`);
        return segment.shapes.map(
          (shape: P.IShape): number =>
            physicalShapeBounds(poses[bone]!, shape).min.y,
        );
      },
    );
    if (!heights.length) throw new Error("Empty physical floor-chain patch");
    const clearance: number = Math.min(...heights) - input.floor;
    const floor: number =
      activeFloor === undefined
        ? Math.min(0, clearance)
        : activeFloor
          ? clearance
          : 0;
    if (input.endpointHeight !== undefined)
      return [
        endpoint.x - input.goal.x,
        endpoint.z - input.goal.z,
        endpoint.y - input.endpointHeight,
        ...(input.floorPoints ?? []).map(
          (point: { bone: string; localPoint: IAutoMovieVector3 }): number =>
            physicalSupportPoint(poses[point.bone]!, point.localPoint).y -
            input.floor,
        ),
        floor,
      ];
    if (input.floorPoints?.length)
      return [
        endpoint.x - input.goal.x,
        endpoint.z - input.goal.z,
        ...input.floorPoints.map(
          (point: { bone: string; localPoint: IAutoMovieVector3 }): number =>
            physicalSupportPoint(poses[point.bone]!, point.localPoint).y -
            input.floor,
        ),
        floor,
      ];
    return [endpoint.x - input.goal.x, endpoint.z - input.goal.z, clearance];
  }
}
