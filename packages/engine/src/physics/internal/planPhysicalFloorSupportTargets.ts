import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePlanPhysicalFloorSupportTargets,
  IAutoMoviePlanPhysicalSupportTargets,
  IAutoMovieRigidTransform,
  IAutoMovieSolvePhysicalArticulationTargets,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalShapeBoundsImplementation } from "./physicalShapeBoundsImplementation";
import { physicalSupportPoint } from "./physicalSupportPoint";
import { planPhysicalSupportTargets } from "./planPhysicalSupportTargets";
import { AutoMovieEnginePhysicalFloorChainTarget } from "../AutoMovieEnginePhysicalFloorChainTarget";

/*
 * Fit declared support patches to a plane using their actual convex geometry.
 * Keep authored endpoint goals and their floor constraints in the same fit,
 * retaining any unresolved residual. A shared root-drop budget is consumed
 * across passes; cached bodies are never corrected. Non-planted patches
 * preserve their authored clearance, clamped to the floor, so a root-drop
 * correction cannot drive a swinging sole below it.
 */
export function planPhysicalFloorSupportTargets(
  input: IAutoMoviePlanPhysicalFloorSupportTargets.IInput,
): IAutoMoviePlanPhysicalFloorSupportTargets.IResult {
  if (
    input.passes < 1 ||
    input.passes > 16 ||
    input.maximumRootDrop < 0 ||
    Object.keys(input.endpointHeights ?? {}).some(
      (bone: string): boolean =>
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
  // Owned copies of each pose's two vectors, the generic serializer's result
  // without its cost.
  let targets: Record<string, IAutoMovieRigidTransform> = Object.fromEntries(
    Object.entries(input.targets).map(
      ([bone, pose]: [string, IAutoMovieRigidTransform]): [
        string,
        IAutoMovieRigidTransform,
      ] => [
        bone,
        { position: { ...pose.position }, rotation: { ...pose.rotation } },
      ],
    ),
  );
  const goals: Record<string, IAutoMovieVector3> = Object.fromEntries(
    input.pattern.limbs.map(
      (
        limb: IAutoMovieFootfallPattern["limbs"][number],
      ): [string, IAutoMovieVector3] => [
        limb.bone,
        {
          ...(input.goals[limb.bone] ??
            physicalSupportPoint(targets[limb.bone]!, limb.localPoint)),
        },
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
    const result: IAutoMoviePlanPhysicalSupportTargets.IResult =
      planPhysicalSupportTargets({
        ...input,
        targets,
        goals,
        maximumRootDrop: Math.max(0, input.maximumRootDrop - rootDrop),
      });
    targets = result.targets;
    rootDrop += result.rootDrop;
    for (const limb of input.pattern.limbs) {
      const planted: boolean = input.planted.includes(limb.bone);
      const fitted: IAutoMovieSolvePhysicalArticulationTargets.IResult =
        AutoMovieEnginePhysicalFloorChainTarget.solve({
          profile: input.profile,
          targets,
          chain: limb.chain,
          contacts: limb.contacts ?? [limb.bone],
          goal: goals[limb.bone]!,
          localPoint: limb.localPoint,
          endpointHeight: input.endpointHeights?.[limb.bone],
          floorPoints: planted ? limb.floorPoints : undefined,
          fitPatchMinimum: planted,
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

  /*
   * A patch contains declared colliders, not an assumed species-specific sole.
   */
  function minimum(limb: IAutoMovieFootfallPattern["limbs"][number]): number {
    const heights: number[] = (limb.contacts ?? [limb.bone]).flatMap(
      (bone: string): number[] => {
        const segment: IAutoMoviePhysicalSegment | undefined =
          input.profile.segments.find(
            (candidate: IAutoMoviePhysicalSegment): boolean =>
              candidate.bone === bone,
          );
        if (!segment || !targets[bone])
          throw new Error(`Missing support patch ${bone}`);
        return segment.shapes.map(
          (shape: IAutoMoviePhysicalShape): number =>
            physicalShapeBoundsImplementation.physicalShapeBounds(targets[bone]!, shape).min.y,
        );
      },
    );
    if (!heights.length) throw new Error(`Empty support patch ${limb.bone}`);
    return Math.min(...heights);
  }
}
