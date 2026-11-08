import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { planPhysicalSupportTargets } from "./planPhysicalSupportTargets";
import { solvePhysicalFloorChainTarget } from "./solvePhysicalFloorChainTarget";

/**
 * Fit declared support patches to a plane using their actual convex geometry.
 * Keep authored horizontal goals and solve the actual patch height together
 * with those goals, retaining unreachable endpoint/floor residuals.
 * A shared root-drop budget is consumed across passes; cached bodies are never
 * corrected. Non-planted patches preserve their authored clearance, clamped
 * to the floor, so a root-drop correction cannot drive a swinging sole below it.
 */
export function planPhysicalFloorSupportTargets(input: {
  /** Admitted fixed-pivot profile. */ profile: P;
  /** Arbitrary support chains and patch owners. */ pattern: IAutoMovieFootfallPattern;
  /** Already admitted native motor placements. */ targets: Readonly<
    Record<string, P.ITransform>
  >;
  /** Authored endpoint goals, in world metres. */ goals: Readonly<
    Record<string, IAutoMovieVector3>
  >;
  /** Endpoints whose declared patches must touch the plane. */ planted: readonly string[];
  /** Explicit world endpoint heights retained alongside floor nonpenetration. Omission preserves the plane-fitting contract. */ endpointHeights?: Readonly<
    Record<string, number>
  >;
  /** World plane height, metres. */ floor: number;
  /** Total permitted root lowering across all passes, metres. */ maximumRootDrop: number;
  /** Bounded outer orientation/height passes, 1..16. */ passes: number;
  /** Per-chain IK iterations, 1..64. */ iterations: number;
  /** Metre endpoint and floor early-out threshold. */ tolerance: number;
}): {
  targets: Record<string, P.ITransform>;
  goals: Record<string, IAutoMovieVector3>;
  residuals: Record<string, number>;
  floorErrors: Record<string, number>;
  rootDrop: number;
} {
  if (
    !Number.isSafeInteger(input.passes) ||
    input.passes < 1 ||
    input.passes > 16 ||
    !Number.isFinite(input.floor) ||
    !Number.isFinite(input.maximumRootDrop) ||
    input.maximumRootDrop < 0 ||
    (input.endpointHeights !== undefined &&
      !isAutoMovieRecord(input.endpointHeights)) ||
    Object.entries(input.endpointHeights ?? {}).some(
      ([bone, height]: [string, number]): boolean =>
        !Number.isFinite(height) ||
        !input.pattern.limbs.some(
          (limb: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
            limb.bone === bone,
        ),
    ) ||
    input.planted.some(
      (bone: string): boolean =>
        !input.pattern.limbs.some(
          (limb: IAutoMovieFootfallPattern["limbs"][number]): boolean =>
            limb.bone === bone,
        ),
    )
  )
    throw new Error("Invalid floor-support fitting policy");
  let targets: Record<string, P.ITransform> = structuredClone(input.targets);
  const goals: Record<string, IAutoMovieVector3> = Object.fromEntries(
    input.pattern.limbs.map(
      (
        limb: IAutoMovieFootfallPattern["limbs"][number],
      ): [string, IAutoMovieVector3] => [
        limb.bone,
        structuredClone(
          input.goals[limb.bone] ??
            physicalSupportPoint(targets[limb.bone]!, limb.localPoint),
        ),
      ],
    ),
  );
  const planes: Record<string, number> = Object.fromEntries(
    input.pattern.limbs.map(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): [string, number] => [
        limb.bone,
        input.planted.includes(limb.bone)
          ? input.floor
          : Math.max(
              input.floor,
              minimum(limb) +
                goals[limb.bone]!.y -
                physicalSupportPoint(targets[limb.bone]!, limb.localPoint).y,
            ),
      ],
    ),
  );
  let rootDrop: number = 0;
  const residuals: Record<string, number> = {};
  const floorErrors: Record<string, number> = {};
  for (let pass: number = 0; pass < input.passes; pass++) {
    for (const limb of input.pattern.limbs)
      goals[limb.bone]!.y =
        input.endpointHeights?.[limb.bone] ??
        physicalSupportPoint(targets[limb.bone]!, limb.localPoint).y +
          planes[limb.bone]! -
          minimum(limb);
    const result: ReturnType<typeof planPhysicalSupportTargets> =
      planPhysicalSupportTargets({
        ...input,
        targets,
        goals,
        maximumRootDrop: Math.max(0, input.maximumRootDrop - rootDrop),
      });
    targets = result.targets;
    rootDrop += result.rootDrop;
    for (const limb of input.pattern.limbs) {
      const fitted: ReturnType<typeof solvePhysicalFloorChainTarget> =
        solvePhysicalFloorChainTarget({
          profile: input.profile,
          targets,
          chain: limb.chain,
          contacts: limb.contacts ?? [limb.bone],
          goal: goals[limb.bone]!,
          localPoint: limb.localPoint,
          endpointHeight: input.endpointHeights?.[limb.bone],
          floorPoints: input.planted.includes(limb.bone)
            ? limb.floorPoints
            : undefined,
          floor: planes[limb.bone]!,
          iterations: input.iterations,
          tolerance: input.tolerance,
        });
      targets = fitted.targets;
      residuals[limb.bone] = fitted.residual;
      floorErrors[limb.bone] = minimum(limb) - planes[limb.bone]!;
      goals[limb.bone]!.y =
        input.endpointHeights?.[limb.bone] ??
        physicalSupportPoint(targets[limb.bone]!, limb.localPoint).y -
          floorErrors[limb.bone]!;
    }
    if (
      [
        ...Object.values(residuals),
        ...Object.values(floorErrors).map(Math.abs),
      ].every((error: number): boolean => error <= input.tolerance)
    )
      break;
  }
  return { targets, goals, residuals, floorErrors, rootDrop };

  /** A patch contains declared colliders, not an assumed species-specific sole. */
  function minimum(limb: IAutoMovieFootfallPattern["limbs"][number]): number {
    const heights: number[] = (limb.contacts ?? [limb.bone]).flatMap(
      (bone: string): number[] => {
        const segment: P.ISegment | undefined = input.profile.segments.find(
          (candidate: P.ISegment): boolean => candidate.bone === bone,
        );
        if (!segment || !targets[bone])
          throw new Error(`Missing support patch ${bone}`);
        return segment.shapes.map(
          (shape: P.IShape): number =>
            physicalShapeBounds(targets[bone]!, shape).min.y,
        );
      },
    );
    if (!heights.length) throw new Error(`Empty support patch ${limb.bone}`);
    return Math.min(...heights);
  }
}
