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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Fit declared support patches to a plane using their actual convex geometry) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Fit declared support patches to a plane using their actual convex geometry) directly over its typed inputs (`input`) as nested iteration of depth 3 (some over Object.entries(input.endpointHeights ?? ; some over input.pattern.limbs; some over input.planted), delegating to `Number.isSafeInteger`, `Number.isFinite`, `isAutoMovieRecord`, `Object.entries(input.endpointHeights ?? {}).some`, `Object.entries`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (3 throw sites). Beyond structural 0, 1 and 2 the body uses the literal 16, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 129 lines and 10 top-level statements that reuses `Number.isSafeInteger`, `Number.isFinite`, `isAutoMovieRecord`, `Object.entries(input.endpointHeights ?? {}).some`, `Object.entries` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 13 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (some over Object.entries(input.endpointHeights ?? ; some over input.pattern.limbs; some over input.planted), performed once per call with 14 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 14 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function planPhysicalFloorSupportTargets(
  input: IAutoMoviePlanPhysicalFloorSupportTargets.IInput,
): IAutoMoviePlanPhysicalFloorSupportTargets.IResult {
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
  let targets: Record<string, IAutoMovieRigidTransform> = structuredClone(
    input.targets,
  );
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
      const fitted: IAutoMovieSolvePhysicalArticulationTargets.IResult =
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
        const segment: IAutoMoviePhysicalSegment | undefined =
          input.profile.segments.find(
            (candidate: IAutoMoviePhysicalSegment): boolean =>
              candidate.bone === bone,
          );
        if (!segment || !targets[bone])
          throw new Error(`Missing support patch ${bone}`);
        return segment.shapes.map(
          (shape: IAutoMoviePhysicalShape): number =>
            physicalShapeBounds(targets[bone]!, shape).min.y,
        );
      },
    );
    if (!heights.length) throw new Error(`Empty support patch ${limb.bone}`);
    return Math.min(...heights);
  }
}
